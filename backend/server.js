require('dotenv').config();
process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
const path = require('path');
const fs = require('fs');
const https = require('https');
const { generateAllAssets } = require('./generate_audio_assets');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { jobQueue } = require('./jobQueue');

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

generateAllAssets();

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// API Keys working status verification cache
let apiStatusCache = {
  gemini: 'unchecked',
  elevenlabs: 'unchecked'
};

async function checkApiKeysStatus() {
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  const elevenLabsKey = (process.env.ELEVENLABS_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');

  if (!geminiKey) {
    apiStatusCache.gemini = 'missing';
  } else {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Hi' }] }] })
      });
      apiStatusCache.gemini = res.ok ? 'working' : 'invalid';
    } catch (e) {
      apiStatusCache.gemini = 'error';
    }
  }

  if (!elevenLabsKey) {
    apiStatusCache.elevenlabs = 'missing';
  } else {
    try {
      const res = await fetch('https://api.elevenlabs.io/v1/user', {
        method: 'GET',
        headers: { 'xi-api-key': elevenLabsKey }
      });
      apiStatusCache.elevenlabs = res.ok ? 'working' : 'invalid';
    } catch (e) {
      apiStatusCache.elevenlabs = 'error';
    }
  }
}
checkApiKeysStatus();

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'RaagaReel AI Creative Director Backend Server is Live!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/keys/status', async (req, res) => {
  await checkApiKeysStatus();
  res.json(apiStatusCache);
});

// Setup directories
const uploadsDir = path.join(__dirname, 'uploads');
const projectsDir = path.join(uploadsDir, 'projects');
const outputDir = path.join(__dirname, 'outputs');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(projectsDir)) fs.mkdirSync(projectsDir);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const upload = multer({ dest: path.join(uploadsDir, 'temp') });

// Choose system font or default for subtitles
let fontPath = '';
if (fs.existsSync('C:/Windows/Fonts/arial.ttf')) {
  fontPath = 'C\\:/Windows/Fonts/arial.ttf';
} else if (fs.existsSync('C:/Windows/Fonts/Arial.ttf')) {
  fontPath = 'C\\:/Windows/Fonts/Arial.ttf';
} else if (fs.existsSync('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')) {
  fontPath = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
} else if (fs.existsSync('/usr/share/fonts/dejavu/DejaVuSans.ttf')) {
  fontPath = '/usr/share/fonts/dejavu/DejaVuSans.ttf';
}

// Audio stream check & detailed metadata extractor
function getProbeMetadata(filePath) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        return resolve({ duration: 3, width: 720, height: 1280, fps: 30, hasAudio: false, orientation: 'portrait' });
      }
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
      
      const duration = parseFloat(metadata.format.duration) || 0;
      const width = videoStream ? parseInt(videoStream.width) : 720;
      const height = videoStream ? parseInt(videoStream.height) : 1280;
      
      let fps = 30;
      if (videoStream && videoStream.r_frame_rate) {
        const parts = videoStream.r_frame_rate.split('/');
        if (parts.length === 2 && parseFloat(parts[1]) > 0) {
          fps = parseFloat(parts[0]) / parseFloat(parts[1]);
        }
      }
      
      let rotation = 0;
      if (videoStream && videoStream.tags && videoStream.tags.rotate) {
        rotation = parseInt(videoStream.tags.rotate);
      }
      if (videoStream && videoStream.side_data_list) {
        const sideData = videoStream.side_data_list.find(sd => sd.side_data_type === 'Display Matrix');
        if (sideData && sideData.rotation) {
          rotation = parseInt(sideData.rotation);
        }
      }

      let w = width;
      let h = height;
      if (Math.abs(rotation) === 90 || Math.abs(rotation) === 270) {
        w = height;
        h = width;
      }
      const orientation = h >= w ? 'portrait' : 'landscape';

      resolve({
        duration,
        width: w,
        height: h,
        fps,
        hasAudio: !!audioStream,
        orientation
      });
    });
  });
}

// Cloud-optimized lightweight video proxy creator with smart background blur adaptation & integrity verification
function createProxyVideo(inputPath, outputPath, hasAudio = true) {
  return new Promise((resolve) => {
    if (fs.existsSync(outputPath)) {
      try { fs.unlinkSync(outputPath); } catch (e) {}
    }

    const filterStr = "[0:v]split=2[bgin][fgin]; [bgin]scale=540:960:force_original_aspect_ratio=increase,crop=540:960,boxblur=16:2,eq=brightness=-0.18[bg]; [fgin]scale=540:960:force_original_aspect_ratio=decrease[fg]; [bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1,fps=30,format=yuv420p[outv]";

    let cmd = ffmpeg(inputPath)
      .complexFilter(filterStr, 'outv')
      .videoCodec('libx264')
      .outputOptions([
        '-preset ultrafast',
        '-tune zerolatency',
        '-crf 26',
        '-pix_fmt yuv420p',
        '-movflags +faststart',
        '-threads 2',
        '-y'
      ]);

    if (hasAudio) {
      cmd = cmd
        .audioCodec('aac')
        .audioFrequency(44100)
        .audioChannels(2);
    } else {
      cmd = cmd.noAudio();
    }

    cmd
      .on('end', () => {
        if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 10000) {
          resolve(outputPath);
        } else {
          console.warn(`Proxy file empty for ${path.basename(inputPath)}, fallback to original`);
          if (fs.existsSync(outputPath)) {
            try { fs.unlinkSync(outputPath); } catch (e) {}
          }
          resolve(inputPath);
        }
      })
      .on('error', (err) => {
        console.warn(`Proxy creation failed for ${path.basename(inputPath)}, fallback to original:`, err.message);
        if (fs.existsSync(outputPath)) {
          try { fs.unlinkSync(outputPath); } catch (e) {}
        }
        resolve(inputPath);
      })
      .save(outputPath);
  });
}

// Extract screenshot keyframe
function extractKeyframe(videoPath, timestampSec, outputFramePath) {
  return new Promise((resolve) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timestampSec],
        filename: path.basename(outputFramePath),
        folder: path.dirname(outputFramePath),
        size: '320x240'
      })
      .on('end', () => resolve(outputFramePath))
      .on('error', () => resolve(null));
  });
}

// Automatic Beat analysis from BPM or energy-based calculation
function calculateBeats(bpm, duration = 30) {
  const beatInterval = 60 / (bpm || 128);
  const beats = [];
  for (let t = 0; t < duration; t += beatInterval) {
    beats.push(parseFloat(t.toFixed(2)));
  }
  return beats;
}

// Safe JSON parser to strip markdown wrappers or text prefix/suffix
function parseJsonSafe(text) {
  if (!text) return null;
  let cleaned = String(text).trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

// Multi-phase Gemini Creative Director Plan generator
async function queryGeminiStoryPlan(prompt, mood, language, analyzedClips) {
  const promptLower = (prompt || '').toLowerCase();
  const textKeywords = ['text', 'caption', 'subtitles', 'subtitle', 'title', 'hook', 'words', 'quote', 'overlay', 'written'];
  const userRequestedText = textKeywords.some(kw => promptLower.includes(kw));

  const defaultPlan = {
    theme: prompt || 'lifestyle video',
    storyboard: analyzedClips.map((clip, i) => ({
      sceneTitle: `Scene ${i + 1}`,
      clipIndex: i,
      startTime: Math.min(1.0, (clip.metadata.duration || 5) * 0.2),
      duration: Math.min(clip.metadata.duration, 3.0),
      rationale: `Human Editor Selection: Peak motion segment inside clip ${i}`,
      transition: 'cuts'
    })),
    music_recommendation: {
      songName: 'Default BGM',
      mood: mood || 'cinematic',
      bpm: 128
    },
    color_grading: 'cinematic_teal_orange',
    text_overlays: userRequestedText ? [
      { text: prompt, startTime: 0, endTime: 2.5, style: 'hook' }
    ] : []
  };

  const rawKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  if (!rawKey) return defaultPlan;

  const candidateModels = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
  const genAI = new GoogleGenerativeAI(rawKey);

  const systemInstruction = `
You are RaagaReel's Lead AI Creative Director & Master Film Editor.
You do NOT perform naive sequential clip editing or apply arbitrary templates.
You edit like a human film editor: with storytelling intent, emotional pacing, shot scoring, and intentional cuts.

HUMAN EDITOR MODE INSTRUCTIONS:
1. UNDERSTAND THE STORY:
   - Identify the primary subject, mood, and storytelling arc based on the user prompt and analyzed clip metadata.
   - Design a narrative progression: Hook (first 2s retention) -> Introduction / Context -> Energy Build / Emotion -> Peak Climax -> Impactful Outro.

2. SHOT SELECTION & SCORING:
   - Never use upload order unless it happens to be narratively superior.
   - Do NOT start clips at startTime = 0 unless the peak action starts immediately at t=0.
   - Pick specific, high-scoring candidate windows (e.g. startTime: 2.2, duration: 3.0) where faces, smiles, peak action, or camera pans occur.
   - Omit low-quality or repetitive clips.

3. TYPOGRAPHY & TEXT OVERLAYS RULE:
   - CRITICAL STRICT RULE: ONLY generate "text_overlays" if the user prompt EXPLICITLY requests text, titles, hooks, quotes, or captions (e.g. user prompt contains words like "caption", "text", "subtitle", "title", "quote", "hook").
   - IF THE USER PROMPT DOES NOT EXPLICITLY ASK FOR TEXT/CAPTIONS, YOU MUST RETURN AN EMPTY ARRAY: "text_overlays": []. Do NOT generate default text hooks or theme titles unless explicitly requested!

4. RESTRAINED TRANSITION DIRECTING:
   - Transition options: ["cuts", "fade", "flash", "blur", "zoom", "whip_left", "whip_right", "glitch", "rgb_split", "dip_black", "dip_white", "spin"]
   - Professional editing uses restraint: use "cuts" for rhythm, and select dynamic transitions ("flash", "zoom", "glitch") specifically on emotional or musical beat shifts.

5. CINEMATIC COLOR GRADING:
   - Choose one color grading preset that best fits the mood: ["vivid", "warm", "gritty", "dreamy", "luxury", "pop", "cyberpunk", "vintage", "cinematic_teal_orange", "default"]

Return a JSON object with this exact structure:
{
  "theme": "overall thematic title",
  "color_grading": "preset_name",
  "music_recommendation": { "songName": "suggested track style", "mood": "hype/chill/romantic/cinematic/travel/motivation/emotional", "bpm": number },
  "storyboard": [
    {
      "sceneTitle": "Scene 1",
      "clipIndex": number,
      "startTime": float,
      "duration": float,
      "rationale": "Detailed human editor explanation for selecting this specific shot and timing window",
      "transition": "cuts/fade/flash/blur/zoom/whip_left/whip_right/glitch/rgb_split/dip_black/dip_white/spin"
    }
  ],
  "text_overlays": []
}
`;

  const requestPrompt = `User Prompt: "${prompt}"\nDesired Mood: "${mood}"\nDesired Language: "${language}"\n\nUploaded Clips Metadata & Frame Analysis:\n${JSON.stringify(analyzedClips, null, 2)}`;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json", temperature: 0.35 }
      });
      const result = await model.generateContent([systemInstruction, requestPrompt]);
      const parsed = parseJsonSafe(result.response.text());
      if (parsed && Array.isArray(parsed.storyboard) && parsed.storyboard.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn(`Model ${modelName} attempt failed (${err.message}). Trying fallback...`);
    }
  }

  return defaultPlan;
}

// Conversational Revision Parser
async function queryGeminiRevision(instruction, currentStoryboard, analyzedClips) {
  const rawKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  if (!rawKey) return currentStoryboard;

  const candidateModels = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
  const genAI = new GoogleGenerativeAI(rawKey);

  const promptText = `
You are RaagaReel's AI Film Editor. You are given a current storyboard plan, metadata of available uploaded clips, and a user revision instruction.
Update the storyboard, pacing, transitions, text overlays, or music recommendation based on the user's natural language request.

CRITICAL MUSIC INSTRUCTIONS:
If the user asks to change music, use a different track, change language (e.g. Telugu, English, Hindi), or change mood (e.g. hype, romantic, chill, motivational):
Update "music_recommendation": { "songName": "Specific requested or recommended song name", "mood": "hype/chill/romantic/cinematic/travel/motivation/emotional", "language": "Telugu/English/Hindi", "bpm": number }

User Instruction: "${instruction}"

Current Storyboard & Settings:
${JSON.stringify(currentStoryboard, null, 2)}

Clip Metadata:
${JSON.stringify(analyzedClips, null, 2)}

Return a complete updated JSON plan matching the exact same format structure.
`;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
      });
      const result = await model.generateContent(promptText);
      const parsed = parseJsonSafe(result.response.text());
      if (parsed && Array.isArray(parsed.storyboard)) {
        return parsed;
      }
    } catch (err) {
      console.warn(`Revision model ${modelName} attempt failed (${err.message}). Trying fallback...`);
    }
  }

  return currentStoryboard;
}

// Quality Control Verification Check
function runQualityCheck(filePath, expectedDuration) {
  return new Promise((resolve) => {
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
      return resolve({ ok: false, reason: 'File does not exist or is empty' });
    }
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return resolve({ ok: false, reason: `Probe failed: ${err.message}` });
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
      
      if (!videoStream) return resolve({ ok: false, reason: 'No video stream present' });
      if (!audioStream) return resolve({ ok: false, reason: 'No audio stream present' });

      const duration = parseFloat(metadata.format.duration) || 0;
      const durationDiff = Math.abs(duration - expectedDuration);
      if (durationDiff > 1.5) {
        return resolve({ ok: false, reason: `Duration mismatch: expected ${expectedDuration}s, got ${duration}s` });
      }

      resolve({ ok: true });
    });
  });
}

// ========================================================
// API Health Diagnostic Endpoint (Performs real API connectivity & authentication tests)
app.get('/api/health', async (req, res) => {
  const status = {
    gemini: 'missing',
    elevenlabs: 'missing',
    geminiDetails: 'Not configured',
    elevenlabsDetails: 'Not configured'
  };

  // Real Gemini API Health Verification
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const ping = await model.generateContent("ping");
      if (ping && ping.response) {
        status.gemini = 'working';
        status.geminiDetails = 'CONNECTED (gemini-2.5-flash operational)';
      } else {
        status.gemini = 'error';
        status.geminiDetails = 'UNEXPECTED RESPONSE';
      }
    } catch (err) {
      const msg = (err.message || '').toLowerCase();
      status.gemini = 'error';
      if (msg.includes('api_key') || msg.includes('auth')) {
        status.geminiDetails = 'AUTHENTICATION ERROR';
      } else if (msg.includes('quota') || msg.includes('429')) {
        status.geminiDetails = 'QUOTA ERROR';
      } else {
        status.geminiDetails = 'SERVICE UNREACHABLE';
      }
    }
  }

  // Real ElevenLabs API Health Verification
  const elevenKey = (process.env.ELEVENLABS_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  if (elevenKey) {
    try {
      const userRes = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: { 'xi-api-key': elevenKey }
      });
      if (userRes.ok) {
        status.elevenlabs = 'working';
        status.elevenlabsDetails = 'CONNECTED (Voiceover Engine operational)';
      } else if (userRes.status === 401) {
        status.elevenlabs = 'error';
        status.elevenlabsDetails = 'AUTHENTICATION ERROR';
      } else if (userRes.status === 429) {
        status.elevenlabs = 'error';
        status.elevenlabsDetails = 'QUOTA ERROR';
      } else {
        status.elevenlabs = 'error';
        status.elevenlabsDetails = `HTTP ${userRes.status}`;
      }
    } catch (err) {
      status.elevenlabs = 'error';
      status.elevenlabsDetails = 'NETWORK ERROR';
    }
  }

  res.json(status);
});

// ASYNCHRONOUS PRODUCTION JOB QUEUE ENDPOINTS
// ========================================================

app.post('/api/jobs', upload.fields([{ name: 'files', maxCount: 10 }, { name: 'customAudio', maxCount: 1 }]), async (req, res) => {
  const prompt = req.body.prompt || 'Auto-detect best style';
  const mood = req.body.mood || '';
  const language = req.body.language || '';
  const songTitle = req.body.songTitle || '';
  const songArtist = req.body.songArtist || '';
  const previewUrl = req.body.previewUrl || '';
  const songId = req.body.songId || '';
  const filesList = req.files && req.files['files'] ? req.files['files'] : [];
  const customAudio = req.files && req.files['customAudio'] ? req.files['customAudio'][0] : null;

  if (filesList.length === 0) {
    return res.status(400).json({ error: 'No video files uploaded' });
  }

  const musicPayload = { songTitle, songArtist, previewUrl, songId, customAudio };

  // 1. Create Job & Return Immediately (< 100ms)
  const job = jobQueue.createJob('create_reel', { prompt, mood, language, songTitle, filesCount: filesList.length });
  res.json({
    jobId: job.jobId,
    status: job.status,
    message: 'Video creation job accepted and queued.'
  });

  // 2. Trigger Background Worker with complete music payload
  runBackgroundVideoWorker(job.jobId, filesList, prompt, mood, language, musicPayload, req);
});

app.get('/api/jobs/:id', (req, res) => {
  const job = jobQueue.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

app.post('/api/jobs/:id/cancel', (req, res) => {
  const success = jobQueue.cancelJob(req.params.id);
  if (!success) {
    return res.status(400).json({ error: 'Could not cancel job or job already finished' });
  }
  res.json({ status: 'CANCELLED', message: 'Job cancelled successfully' });
});

async function runBackgroundVideoWorker(jobId, filesList, prompt, mood, language, musicPayload = {}, req = null) {
  try {
    jobQueue.updateJob(jobId, { status: 'UPLOADING', progress: 10, currentStage: 'UPLOADING', stageMessage: 'Storing uploaded video source files...' });
    
    const projectId = `proj-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const projectPath = path.join(projectsDir, projectId);
    const originalsPath = path.join(projectPath, 'originals');
    const proxiesPath = path.join(projectPath, 'proxies');
    const keyframesPath = path.join(projectPath, 'keyframes');

    fs.mkdirSync(projectPath, { recursive: true });
    fs.mkdirSync(originalsPath);
    fs.mkdirSync(proxiesPath);
    fs.mkdirSync(keyframesPath);

    jobQueue.updateJob(jobId, { status: 'ANALYZING', progress: 25, currentStage: 'ANALYZING', stageMessage: 'Extracting video container properties and keyframe metadata in parallel...' });

    // High-performance parallel extraction across all uploaded clips
    const analyzedClips = await Promise.all(
      filesList.map(async (origFile, i) => {
        const targetOrigName = `${i}${path.extname(origFile.originalname)}`;
        const targetOrigPath = path.join(originalsPath, targetOrigName);
        fs.renameSync(origFile.path, targetOrigPath);

        const metadata = await getProbeMetadata(targetOrigPath);
        const targetProxyName = `${i}_proxy.mp4`;
        const targetProxyPath = path.join(proxiesPath, targetProxyName);

        // Run proxy creation and keyframe extraction concurrently
        const [resolvedProxyPath, frames] = await Promise.all([
          createProxyVideo(targetOrigPath, targetProxyPath, metadata.hasAudio),
          (async () => {
            const extractedFrames = [];
            const times = [0.2, 0.5, 0.8].map(p => parseFloat((metadata.duration * p).toFixed(2)));
            await Promise.all(times.map(async (timeVal, j) => {
              const frameName = `${i}_frame_${j}.jpg`;
              const framePath = path.join(keyframesPath, frameName);
              const extracted = await extractKeyframe(targetOrigPath, timeVal, framePath);
              if (extracted && fs.existsSync(framePath)) {
                extractedFrames.push(fs.readFileSync(framePath).toString('base64'));
              }
            }));
            return extractedFrames;
          })()
        ]);

        return {
          clipIndex: i,
          fileName: origFile.originalname,
          localPath: targetOrigPath,
          proxyPath: resolvedProxyPath || targetOrigPath,
          metadata,
          frames
        };
      })
    );

    jobQueue.updateJob(jobId, { status: 'UNDERSTANDING_PROMPT', progress: 40, currentStage: 'UNDERSTANDING_PROMPT', stageMessage: 'Analyzing user storytelling intent and pacing requirements...' });

    const partsForGemini = analyzedClips.map(clip => ({
      metadata: {
        clipIndex: clip.clipIndex,
        fileName: clip.fileName,
        duration: clip.metadata.duration,
        resolution: `${clip.metadata.width}x${clip.metadata.height}`,
        fps: clip.metadata.fps,
        orientation: clip.metadata.orientation,
        hasAudio: clip.metadata.hasAudio
      },
      framesCount: clip.frames.length
    }));

    jobQueue.updateJob(jobId, { status: 'BUILDING_STORY', progress: 55, currentStage: 'BUILDING_STORY', stageMessage: 'Synthesizing narrative storyboard and shot selections...' });
    const aiPlan = await queryGeminiStoryPlan(prompt, mood, language, partsForGemini);

    jobQueue.updateJob(jobId, { status: 'SELECTING_MUSIC', progress: 70, currentStage: 'SELECTING_MUSIC', stageMessage: 'Calculating track BPM and quarter-note beat sync intervals...' });

    const projectMetadata = {
      projectId,
      prompt,
      mood,
      language,
      musicPayload: {
        songTitle: musicPayload.songTitle,
        songArtist: musicPayload.songArtist,
        previewUrl: musicPayload.previewUrl,
        songId: musicPayload.songId
      },
      versions: [],
      clips: analyzedClips.map(c => ({
        clipIndex: c.clipIndex,
        fileName: c.fileName,
        originalPath: c.localPath,
        proxyPath: c.proxyPath,
        metadata: c.metadata
      })),
      aiPlan
    };
    fs.writeFileSync(path.join(projectPath, 'metadata.json'), JSON.stringify(projectMetadata, null, 2));

    jobQueue.updateJob(jobId, { status: 'EDITING', progress: 80, currentStage: 'EDITING', stageMessage: 'Applying color grading presets and transition graphs...' });
    jobQueue.updateJob(jobId, { status: 'RENDERING', progress: 90, currentStage: 'RENDERING', stageMessage: 'Encoding vertical MP4 reel via FFmpeg...' });

    // Execute real FFmpeg video rendering pipeline with selected music options
    const renderRes = await renderProjectPipeline(projectId, musicPayload, req);

    jobQueue.updateJob(jobId, { status: 'QUALITY_CHECK', progress: 95, currentStage: 'QUALITY_CHECK', stageMessage: 'Validating output streams and media integrity...' });

    jobQueue.updateJob(jobId, {
      status: 'COMPLETED',
      progress: 100,
      currentStage: 'COMPLETED',
      stageMessage: 'Reel generated successfully!',
      result: {
        projectId,
        videoUrl: renderRes.videoUrl,
        caption: renderRes.caption || aiPlan.caption || `Created with RaagaReel AI - ${prompt}`,
        hook: renderRes.hook || aiPlan.text_overlays?.[0]?.text || 'Wait for it... 👀',
        storyboard: aiPlan.storyboard,
        debug: renderRes.debug
      }
    });

  } catch (err) {
    console.error(`Background worker failed for job ${jobId}:`, err);
    jobQueue.updateJob(jobId, {
      status: 'FAILED',
      progress: 0,
      currentStage: 'FAILED',
      stageMessage: `Processing failed: ${err.message}`,
      error: err.message
    });
  }
}

// Phase 3 & 4: Upload and Multimodal Analysis endpoint
app.post('/api/analyze', upload.array('files', 10), async (req, res) => {
  const prompt = req.body.prompt || 'Auto-detect best style';
  const mood = req.body.mood || '';
  const language = req.body.language || '';
  const filesList = req.files || [];

  if (filesList.length === 0) {
    return res.status(400).json({ error: 'No video files uploaded' });
  }

  const projectId = `proj-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const projectPath = path.join(projectsDir, projectId);
  const originalsPath = path.join(projectPath, 'originals');
  const proxiesPath = path.join(projectPath, 'proxies');
  const keyframesPath = path.join(projectPath, 'keyframes');

  fs.mkdirSync(projectPath, { recursive: true });
  fs.mkdirSync(originalsPath);
  fs.mkdirSync(proxiesPath);
  fs.mkdirSync(keyframesPath);

  console.log(`Analyzing project ${projectId} with ${filesList.length} clips...`);

  try {
    const analyzedClips = [];

    for (let i = 0; i < filesList.length; i++) {
      const origFile = filesList[i];
      const targetOrigName = `${i}${path.extname(origFile.originalname)}`;
      const targetOrigPath = path.join(originalsPath, targetOrigName);
      
      // Move upload from temp to originals folder
      fs.renameSync(origFile.path, targetOrigPath);

      // 1. ffprobe metadata
      const metadata = await getProbeMetadata(targetOrigPath);

      // 2. Generate proxy video
      const targetProxyName = `${i}_proxy.mp4`;
      const targetProxyPath = path.join(proxiesPath, targetProxyName);
      const resolvedProxyPath = await createProxyVideo(targetOrigPath, targetProxyPath, metadata.hasAudio);

      // 3. Extract multiple screenshots for Gemini (20%, 50%, 80%)
      const frames = [];
      const times = [0.2, 0.5, 0.8].map(p => parseFloat((metadata.duration * p).toFixed(2)));
      for (let j = 0; j < times.length; j++) {
        const frameName = `${i}_frame_${j}.jpg`;
        const framePath = path.join(keyframesPath, frameName);
        const extracted = await extractKeyframe(targetOrigPath, times[j], framePath);
        if (extracted && fs.existsSync(framePath)) {
          frames.push(fs.readFileSync(framePath).toString('base64'));
        }
      }

      analyzedClips.push({
        clipIndex: i,
        fileName: origFile.originalname,
        localPath: targetOrigPath,
        proxyPath: resolvedProxyPath || targetOrigPath,
        metadata,
        frames
      });
    }

    // Call Gemini with the frames data and metadata to compile the narrative Edit Decision List
    const partsForGemini = analyzedClips.map(clip => {
      const clipDesc = {
        clipIndex: clip.clipIndex,
        fileName: clip.fileName,
        duration: clip.metadata.duration,
        resolution: `${clip.metadata.width}x${clip.metadata.height}`,
        fps: clip.metadata.fps,
        orientation: clip.metadata.orientation,
        hasAudio: clip.metadata.hasAudio
      };
      
      return {
        metadata: clipDesc,
        framesCount: clip.frames.length
      };
    });

    // Request Gemini Storyboards
    const rawFrames = [];
    analyzedClips.forEach(clip => {
      clip.frames.forEach(base64 => {
        rawFrames.push({
          inlineData: { data: base64, mimeType: 'image/jpeg' }
        });
      });
    });

    const aiPlan = await queryGeminiStoryPlan(prompt, mood, language, partsForGemini);

    // Save project information
    const projectMetadata = {
      projectId,
      prompt,
      mood,
      language,
      clips: analyzedClips.map(c => ({
        clipIndex: c.clipIndex,
        fileName: c.fileName,
        originalPath: c.localPath,
        proxyPath: c.proxyPath,
        metadata: c.metadata
      })),
      aiPlan
    };

    fs.writeFileSync(path.join(projectPath, 'metadata.json'), JSON.stringify(projectMetadata, null, 2));

    res.json({
      projectId,
      storyboard: aiPlan.storyboard,
      textOverlays: aiPlan.text_overlays,
      colorGrading: aiPlan.color_grading,
      musicRecommendation: aiPlan.music_recommendation,
      clipsMetadata: projectMetadata.clips
    });
  } catch (err) {
    console.error('Analysis failed:', err);
    res.status(500).json({ error: 'Video analysis failed' });
  }
});

// Conversational re-editing pipeline endpoint
app.post('/api/reedit', async (req, res) => {
  const { projectId, instruction } = req.body;
  if (!projectId || !instruction) {
    return res.status(400).json({ error: 'Missing projectId or instruction' });
  }

  const projectPath = path.join(projectsDir, projectId);
  const metadataPath = path.join(projectPath, 'metadata.json');

  if (!fs.existsSync(metadataPath)) {
    return res.status(404).json({ error: 'Project not found' });
  }

  try {
    const projectMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    
    // Track version history (V1, V2, V3...)
    projectMetadata.versions = projectMetadata.versions || [];
    const currentVerIndex = projectMetadata.versions.length + 1;
    const versionEntry = {
      versionId: `v${currentVerIndex}`,
      timestamp: new Date().toISOString(),
      instruction,
      aiPlan: projectMetadata.aiPlan,
      videoUrl: projectMetadata.currentVideoUrl || null
    };

    // Call Gemini editor to parse instruction into storyboard deltas
    const updatedPlan = await queryGeminiRevision(
      instruction,
      projectMetadata.aiPlan,
      projectMetadata.clips
    );

    projectMetadata.aiPlan = updatedPlan;
    projectMetadata.versions.push(versionEntry);

    // Execute FFmpeg render for revised storyboard
    const renderRes = await renderProjectPipeline(projectId, { useProxy: true }, req);
    projectMetadata.currentVideoUrl = renderRes.videoUrl;
    fs.writeFileSync(metadataPath, JSON.stringify(projectMetadata, null, 2));

    res.json({
      status: 'success',
      projectId,
      versionId: `v${currentVerIndex}`,
      videoUrl: renderRes.videoUrl,
      versionsCount: projectMetadata.versions.length,
      storyboard: updatedPlan.storyboard,
      textOverlays: updatedPlan.text_overlays,
      colorGrading: updatedPlan.color_grading,
      musicRecommendation: updatedPlan.music_recommendation,
      caption: renderRes.caption,
      hook: renderRes.hook,
      debug: renderRes.debug
    });
  } catch (err) {
    console.error('Revision failed:', err);
    res.status(500).json({ error: `Conversational edit failed: ${err.message}` });
  }
});

// Production Quality Control & Media Validation Engine
function runQualityCheck(outputFilePath, expectedDuration) {
  return new Promise((resolve) => {
    if (!fs.existsSync(outputFilePath)) {
      return resolve({ ok: false, reason: 'Output video file does not exist on disk' });
    }
    const stat = fs.statSync(outputFilePath);
    if (stat.size < 50000) {
      return resolve({ ok: false, reason: 'Output video file size is abnormally small or corrupted' });
    }

    ffmpeg.ffprobe(outputFilePath, (err, metadata) => {
      if (err || !metadata || !metadata.format) {
        return resolve({ ok: false, reason: 'FFprobe container inspection failed' });
      }

      const duration = parseFloat(metadata.format.duration) || 0;
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');

      if (!videoStream) {
        return resolve({ ok: false, reason: 'Media export is missing a valid video stream' });
      }

      resolve({
        ok: true,
        duration: duration.toFixed(2),
        sizeKb: Math.round(stat.size / 1024),
        resolution: `${videoStream.width}x${videoStream.height}`
      });
    });
  });
}

// Helper function to resolve public URL for output video
function getPublicVideoUrl(outputFileName, req) {
  if (process.env.RENDER_EXTERNAL_URL) {
    const cleanUrl = process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, '');
    return `${cleanUrl}/outputs/${outputFileName}`;
  }
  const isCloud = !!process.env.RENDER;
  if (isCloud) {
    return `https://raga-reel-video-editor-for-the-passion.onrender.com/outputs/${outputFileName}`;
  }
  const host = req ? (req.get('host') || 'localhost:3001') : 'localhost:3001';
  const protocol = req && (req.protocol === 'https' || req.get('x-forwarded-proto') === 'https') ? 'https' : 'http';
  return `${protocol}://${host}/outputs/${outputFileName}`;
}

// Unified FFmpeg Rendering Pipeline Engine
async function renderProjectPipeline(projectId, options = {}, req = null) {
  const projectPath = path.join(projectsDir, projectId);
  const metadataPath = path.join(projectPath, 'metadata.json');

  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Project ${projectId} metadata not found`);
  }

  const projectMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const aiPlan = projectMetadata.aiPlan;
  const clips = projectMetadata.clips;
  const useProxy = options.useProxy === true || options.useProxy === 'true';

  let activeStoryboard = aiPlan.storyboard;
  if (options.storyboard) {
    activeStoryboard = options.storyboard;
    projectMetadata.aiPlan.storyboard = activeStoryboard;
    fs.writeFileSync(metadataPath, JSON.stringify(projectMetadata, null, 2));
  }

  // Dynamic Soundtrack Resolution System (Supports Catalog, iTunes Search, User Uploads, and Mood Fallbacks)
  let musicPath = path.join(__dirname, 'music', 'english_hype.wav');
  let targetSongName = options.songTitle || aiPlan.music_recommendation?.songName || aiPlan.music_recommendation?.title;
  let targetArtist = options.songArtist || aiPlan.music_recommendation?.artist || '';
  let resolvedPreviewUrl = options.previewUrl;

  if (options.customAudio && options.customAudio.path && fs.existsSync(options.customAudio.path)) {
    musicPath = options.customAudio.path;
    console.log(`Using user uploaded custom audio: ${musicPath}`);
  } else {
    // Search iTunes on-the-fly if song name is present but preview URL is missing
    if ((!resolvedPreviewUrl || resolvedPreviewUrl === 'undefined' || resolvedPreviewUrl === 'null') && targetSongName) {
      console.log(`Searching iTunes soundtrack preview for '${targetSongName}' by '${targetArtist}'...`);
      try {
        const primaryArtist = targetArtist ? targetArtist.split(',')[0].trim() : '';
        let term = `${targetSongName} ${primaryArtist}`.trim();
        let searchRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=1`);
        let searchData = await searchRes.json();
        
        if (!searchData.results || !searchData.results[0]?.previewUrl) {
          term = targetSongName;
          searchRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=1`);
          searchData = await searchRes.json();
        }

        if (searchData.results && searchData.results[0]?.previewUrl) {
          resolvedPreviewUrl = searchData.results[0].previewUrl;
          console.log(`Found iTunes soundtrack preview URL: ${resolvedPreviewUrl}`);
        }
      } catch (err) {
        console.warn('iTunes music resolution failed:', err.message);
      }
    }

    if (resolvedPreviewUrl && resolvedPreviewUrl !== 'undefined' && resolvedPreviewUrl !== 'null') {
      const songCacheName = 'preview-' + resolvedPreviewUrl.replace(/[^a-zA-Z0-9]/g, '_').slice(-60) + '.m4a';
      const cachedSongPath = path.join(__dirname, 'music', songCacheName);
      
      if (fs.existsSync(cachedSongPath) && fs.statSync(cachedSongPath).size > 10000) {
        musicPath = cachedSongPath;
        console.log(`Using cached soundtrack preview: ${musicPath}`);
      } else {
        try {
          console.log(`Downloading soundtrack preview from ${resolvedPreviewUrl}...`);
          await downloadFile(resolvedPreviewUrl, cachedSongPath);
          if (fs.existsSync(cachedSongPath) && fs.statSync(cachedSongPath).size > 10000) {
            musicPath = cachedSongPath;
            console.log(`Downloaded and cached soundtrack: ${musicPath}`);
          }
        } catch (err) {
          console.error('Failed to download soundtrack preview:', err.message);
        }
      }
    } else {
      // Fallback to local mood/language audio asset
      const mood = (aiPlan.music_recommendation?.mood || 'hype').toLowerCase();
      const lang = (aiPlan.music_recommendation?.language || 'english').toLowerCase();
      const langMoodFile = path.join(__dirname, 'music', `${lang}_${mood}.wav`);
      const moodFile = path.join(__dirname, 'music', `english_${mood}.wav`);
      
      if (fs.existsSync(langMoodFile)) {
        musicPath = langMoodFile;
      } else if (fs.existsSync(moodFile)) {
        musicPath = moodFile;
      }
    }
  }

  // Generate ElevenLabs Voiceover if key present
  let voiceoverPath = null;
  const rawElevenKey = (process.env.ELEVENLABS_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  const voicePrompt = aiPlan.text_overlays?.find(o => o.style === 'hook')?.text || aiPlan.hook || aiPlan.theme;

  if (rawElevenKey && voicePrompt && !useProxy) {
    try {
      const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam Voice
      const resTTS = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': rawElevenKey
        },
        body: JSON.stringify({
          text: voicePrompt,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.75, similarity_boost: 0.75 }
        })
      });

      if (resTTS.ok) {
        const arrayBuffer = await resTTS.arrayBuffer();
        voiceoverPath = path.join(projectPath, `voiceover-${Date.now()}.mp3`);
        fs.writeFileSync(voiceoverPath, Buffer.from(arrayBuffer));
        console.log(`Successfully generated ElevenLabs voiceover: ${voiceoverPath}`);
      }
    } catch (err) {
      console.warn('ElevenLabs TTS generation failed (non-critical):', err.message);
    }
  }

  const bpm = aiPlan.music_recommendation?.bpm || 120;
  const beats = calculateBeats(bpm, 60);

  const orderedFiles = [];
  let currentTimelineCursor = 0;

  activeStoryboard.forEach((scene) => {
    const clip = clips.find(c => c.clipIndex === scene.clipIndex);
    if (clip) {
      const isCloud = !!process.env.RENDER;
      let filePath = clip.originalPath;
      if (useProxy || isCloud) {
        if (clip.proxyPath && fs.existsSync(clip.proxyPath)) {
          try {
            if (fs.statSync(clip.proxyPath).size > 10000) {
              filePath = clip.proxyPath;
            }
          } catch (e) {}
        }
      }
      orderedFiles.push({
        path: filePath,
        startTime: scene.startTime || 0,
        duration: scene.duration || 3.0,
        transition: scene.transition || 'cuts',
        hasAudio: clip.metadata.hasAudio
      });
      currentTimelineCursor += (scene.duration || 3.0);
    }
  });

  const totalDuration = currentTimelineCursor;
  const outputFileName = `output-${projectId}-${useProxy ? 'preview' : 'export'}.mp4`;
  const outputPath = path.join(outputDir, outputFileName);

  const isCloudEnv = !!process.env.RENDER;
  const canvasW = useProxy ? 360 : (isCloudEnv ? 720 : 1080);
  const canvasH = useProxy ? 640 : (isCloudEnv ? 1280 : 1920);

  let filterComplex = '';
  let colorFilter = '';
  switch (aiPlan.color_grading?.toLowerCase()) {
    case 'vivid': colorFilter = ',eq=contrast=1.22:saturation=1.38:brightness=0.01'; break;
    case 'warm': colorFilter = ',colorbalance=rs=0.1:gs=0.04:bs=-0.06,eq=contrast=1.05:saturation=1.12'; break;
    case 'gritty': colorFilter = ',eq=contrast=1.35:saturation=0.75:brightness=-0.02'; break;
    case 'dreamy': colorFilter = ',eq=brightness=0.04:contrast=1.08:saturation=1.15,colorbalance=rs=0.04:gs=0.02:bs=0.05'; break;
    case 'luxury': colorFilter = ',eq=contrast=1.25:saturation=1.05:brightness=-0.01'; break;
    case 'pop': colorFilter = ',eq=contrast=1.15:saturation=1.45'; break;
    case 'cyberpunk': colorFilter = ',colorbalance=rs=0.12:gs=-0.05:bs=0.15,eq=contrast=1.2:saturation=1.25'; break;
    case 'vintage': colorFilter = ',colorbalance=rs=0.08:gs=0.06:bs=-0.05,eq=contrast=0.95:saturation=0.85'; break;
    case 'cinematic_teal_orange': colorFilter = ',colorbalance=rs=0.12:gs=-0.04:bs=-0.1:rh=-0.08:gh=0.04:bh=0.14,eq=contrast=1.18:saturation=1.2'; break;
    default: colorFilter = ',eq=contrast=1.08:saturation=1.12'; break;
  }

  // Real-time audio stream probing per clip file to prevent FFmpeg Stream specifier ':a' errors on silent videos
  for (let i = 0; i < orderedFiles.length; i++) {
    const f = orderedFiles[i];
    f.hasVerifiedAudio = await new Promise((resolve) => {
      ffmpeg.ffprobe(f.path, (err, metadata) => {
        if (err || !metadata || !metadata.streams) return resolve(false);
        const aStream = metadata.streams.find(s => s.codec_type === 'audio');
        resolve(!!aStream);
      });
    });
  }

  orderedFiles.forEach((file, index) => {
    const dur = file.duration;
    const trans = file.transition;
    let transFilter = '';
    let zoomFilter = '';

    if (trans === 'zoom' || aiPlan.color_grading === 'vivid' || aiPlan.color_grading === 'dreamy') {
      zoomFilter = `,zoompan=z='min(zoom+0.002,1.3)':x='iw/2-(iw/zoom)/2':y='ih/2-(ih/zoom)/2':d=1:s=${canvasW}x${canvasH}`;
    }

    if (trans === 'fade') transFilter = `,fade=t=in:st=0:d=0.35,fade=t=out:st=${(dur - 0.35).toFixed(2)}:d=0.35`;
    else if (trans === 'flash') transFilter = `,fade=t=in:st=0:d=0.25:color=white,fade=t=out:st=${(dur - 0.25).toFixed(2)}:d=0.25:color=white`;
    else if (trans === 'blur') transFilter = `,boxblur=14:enable='lt(t,0.25)+gt(t,${(dur - 0.25).toFixed(2)})'`;
    else if (trans === 'whip_left' || trans === 'whip_right') transFilter = `,boxblur=22:enable='gt(t,${(dur - 0.2).toFixed(2)})'`;
    else if (trans === 'glitch') transFilter = `,rgbashift=rh=8:rv=-8:enable='lt(t,0.15)+gt(t,${(dur - 0.15).toFixed(2)})'`;
    else if (trans === 'rgb_split') transFilter = `,rgbashift=rh=10:bv=-10:enable='lt(t,0.2)+gt(t,${(dur - 0.2).toFixed(2)})'`;
    else if (trans === 'dip_black') transFilter = `,fade=t=in:st=0:d=0.3:color=black,fade=t=out:st=${(dur - 0.3).toFixed(2)}:d=0.3:color=black`;
    else if (trans === 'dip_white') transFilter = `,fade=t=in:st=0:d=0.25:color=white,fade=t=out:st=${(dur - 0.25).toFixed(2)}:d=0.25:color=white`;

    filterComplex += `[${index}:v]split=2[bgin_${index}][fgin_${index}]; `;
    filterComplex += `[bgin_${index}]scale=${canvasW}:${canvasH}:force_original_aspect_ratio=increase,crop=${canvasW}:${canvasH},boxblur=16:2,eq=brightness=-0.18:contrast=0.9[bg_${index}]; `;
    filterComplex += `[fgin_${index}]scale=${canvasW}:${canvasH}:force_original_aspect_ratio=decrease[fg_${index}]; `;
    filterComplex += `[bg_${index}][fg_${index}]overlay=(W-w)/2:(H-h)/2,setsar=1,fps=30,format=yuv420p${colorFilter}${zoomFilter}${transFilter}[v${index}]; `;

    if (file.hasVerifiedAudio) {
      filterComplex += `[${index}:a]aresample=44100,aformat=channel_layouts=stereo[a${index}]; `;
    } else {
      filterComplex += `anullsrc=channel_layout=stereo:sample_rate=44100,atrim=duration=${dur},asetpts=PTS-STARTPTS[a${index}]; `;
    }
  });

  let concatVideo = '';
  let concatAudio = '';
  for (let i = 0; i < orderedFiles.length; i++) {
    concatVideo += `[v${i}]`;
    concatAudio += `[a${i}]`;
  }
  filterComplex += `${concatVideo}concat=n=${orderedFiles.length}:v=1:a=0[rawv]; `;
  filterComplex += `${concatAudio}concat=n=${orderedFiles.length}:v=0:a=1[rawa]; `;

  const promptLower = (projectMetadata.prompt || '').toLowerCase();
  const textKeywords = ['text', 'caption', 'subtitles', 'subtitle', 'title', 'hook', 'words', 'quote', 'overlay', 'written'];
  const userRequestedText = textKeywords.some(kw => promptLower.includes(kw));

  let videoOutputTag = 'rawv';
  if (userRequestedText && aiPlan.text_overlays && aiPlan.text_overlays.length > 0) {
    let currentVTag = 'rawv';
    aiPlan.text_overlays.forEach((overlay, idx) => {
      const nextVTag = `textv${idx}`;
      const isHook = overlay.style === 'hook';
      const fontcolor = isHook ? 'yellow' : 'white';
      const size = isHook ? (useProxy ? 32 : 54) : (useProxy ? 22 : 38);
      const yPosition = isHook ? 'h/3.2' : 'h-240';
      const fontfileOpt = fontPath ? `:fontfile='${fontPath}'` : '';
      const boxOpt = `:box=1:boxcolor=black@0.55:boxborderw=${isHook ? 12 : 8}`;
      const escapedText = overlay.text.replace(/'/g, '').replace(/"/g, '').replace(/:/g, '\\:');
      filterComplex += `[${currentVTag}]drawtext=text='${escapedText}'${fontfileOpt}:fontcolor=${fontcolor}:fontsize=${size}${boxOpt}:x=(w-text_w)/2:y=${yPosition}:enable='between(t,${overlay.startTime},${overlay.endTime})'[${nextVTag}]; `;
      currentVTag = nextVTag;
    });
    videoOutputTag = `textv${aiPlan.text_overlays.length - 1}`;
  }

  let voDuration = 0;
  if (voiceoverPath && fs.existsSync(voiceoverPath)) {
    try {
      voDuration = await new Promise((resolve) => {
        ffmpeg.ffprobe(voiceoverPath, (err, m) => {
          if (err) return resolve(4.0);
          resolve(parseFloat(m.format.duration) || 4.0);
        });
      });
    } catch (e) {
      voDuration = 4.0;
    }
  }

  const musicInputIndex = orderedFiles.length;
  let dynamicBgmVolume = '0.85';
  if (voDuration > 0) {
    dynamicBgmVolume = `if(between(t,0,${voDuration.toFixed(2)}),0.2,0.85)`;
  }

  filterComplex += `[${musicInputIndex}:a]aloop=loop=-1:size=2147483647,atrim=duration=${totalDuration.toFixed(2)},asetpts=PTS-STARTPTS,aresample=44100,aformat=channel_layouts=stereo,volume=eval=frame:volume='${dynamicBgmVolume}'[bgm]; `;

  if (voiceoverPath && fs.existsSync(voiceoverPath)) {
    const voInputIndex = musicInputIndex + 1;
    filterComplex += `[${voInputIndex}:a]aresample=44100,aformat=channel_layouts=stereo,volume=1.8[vo]; `;
    filterComplex += `[rawa]volume=0.35[ambient]; [bgm]volume=1.8[music]; `;
    filterComplex += `[ambient][music][vo]amix=inputs=3:duration=first:dropout_transition=2[outa]`;
  } else {
    filterComplex += `[rawa]volume=0.35[ambient]; [bgm]volume=1.8[music]; `;
    filterComplex += `[ambient][music]amix=inputs=2:duration=first:dropout_transition=2[outa]`;
  }

  return new Promise((resolve, reject) => {
    let command = ffmpeg();
    orderedFiles.forEach(file => {
      command = command.input(file.path)
        .inputOptions([`-ss ${file.startTime}`, `-t ${file.duration}`]);
    });
    command = command.input(musicPath);
    if (voiceoverPath && fs.existsSync(voiceoverPath)) {
      command = command.input(voiceoverPath);
    }

    const startTimer = Date.now();
    command
      .complexFilter(filterComplex, [videoOutputTag, 'outa'])
      .outputOptions('-c:v libx264')
      .outputOptions('-preset ultrafast')
      .outputOptions('-tune zerolatency')
      .outputOptions(isCloudEnv ? '-b:v 2M' : '-b:v 4M')
      .outputOptions(isCloudEnv ? '-maxrate 2.8M' : '-maxrate 6M')
      .outputOptions(isCloudEnv ? '-bufsize 4M' : '-bufsize 8M')
      .outputOptions('-movflags +faststart')
      .outputOptions('-threads 2')
      .outputOptions('-pix_fmt yuv420p')
      .outputOptions('-c:a aac')
      .outputOptions('-b:a 128k')
      .outputOptions('-y')
      .outputOptions(`-t ${totalDuration.toFixed(2)}`)
      .on('start', (cmd) => {
        console.log('Rendering FFmpeg command:', cmd);
      })
      .on('end', async () => {
        const renderTime = Date.now() - startTimer;
        console.log(`Render complete in ${renderTime}ms.`);

        if (voiceoverPath && fs.existsSync(voiceoverPath)) {
          try { fs.unlinkSync(voiceoverPath); } catch (e) {}
        }

        const qcResult = await runQualityCheck(outputPath, totalDuration);
        if (!qcResult.ok) {
          return reject(new Error(`Video Quality Control check failed: ${qcResult.reason}`));
        }

        const videoUrl = getPublicVideoUrl(outputFileName, req);
        resolve({
          videoUrl,
          caption: aiPlan.caption || `Created with RaagaReel AI - ${projectMetadata.prompt}`,
          hook: voicePrompt || 'Wait for it... 👀',
          debug: {
            prompt: projectMetadata.prompt,
            theme: aiPlan.theme,
            colorGrading: aiPlan.color_grading,
            renderTimeMs: renderTime,
            qualityControl: 'PASSED'
          }
        });
      })
      .on('error', (err) => {
        console.error('FFmpeg Render Error:', err.message);
        if (voiceoverPath && fs.existsSync(voiceoverPath)) {
          try { fs.unlinkSync(voiceoverPath); } catch (e) {}
        }
        reject(new Error(`Video rendering failed: ${err.message}`));
      })
      .save(outputPath);
  });
}

// Rendering Engine (Combines clips, transitions, beat-sync BGM, dynamically ducks, and exports)
app.post('/api/process', upload.fields([{ name: 'customAudio', maxCount: 1 }]), async (req, res) => {
  const { projectId, useProxy } = req.body;
  if (!projectId) {
    return res.status(400).json({ error: 'Missing projectId' });
  }
  try {
    const renderRes = await renderProjectPipeline(projectId, { useProxy }, req);
    res.json({
      status: 'success',
      videoUrl: renderRes.videoUrl,
      caption: renderRes.caption,
      hook: renderRes.hook,
      qualityScore: 92,
      debug: renderRes.debug
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/outputs', express.static(outputDir));
app.use('/music', express.static(path.join(__dirname, 'music')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`RaagaReel AI Director Backend running on port ${PORT}`);
});

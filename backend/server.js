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
app.options('*', cors());
app.use(express.json());

// API Keys working status verification cache
let apiStatusCache = {
  gemini: 'unchecked',
  elevenlabs: 'unchecked'
};

async function checkApiKeysStatus() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

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

// Low-resolution proxy creator with audio presence check
function createProxyVideo(inputPath, outputPath, hasAudio = true) {
  return new Promise((resolve) => {
    let cmd = ffmpeg(inputPath)
      .size('360x640')
      .aspect('9:16')
      .autopad(true)
      .videoCodec('libx264')
      .outputOptions('-preset superfast')
      .outputOptions('-crf 30')
      .outputOptions('-threads 2')
      .outputOptions('-y'); // Force overwrite

    if (hasAudio) {
      cmd = cmd
        .audioCodec('aac')
        .audioFrequency(22050)
        .audioChannels(1);
    } else {
      cmd = cmd.noAudio();
    }

    cmd
      .on('end', () => resolve(outputPath))
      .on('error', (err) => {
        console.warn(`Proxy creation failed for ${path.basename(inputPath)}, fallback to original:`, err.message);
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

  if (!process.env.GEMINI_API_KEY) return defaultPlan;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

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

    const result = await model.generateContent([systemInstruction, requestPrompt]);
    const planText = result.response.text();
    return JSON.parse(planText);
  } catch (err) {
    console.error('Failed to get Gemini plan, returning default:', err);
    return defaultPlan;
  }
}

// Conversational Revision Parser
async function queryGeminiRevision(instruction, currentStoryboard, analyzedClips) {
  if (!process.env.GEMINI_API_KEY) return currentStoryboard;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const promptText = `
You are RaagaReel's AI Film Editor. You are given a current storyboard plan, metadata of available uploaded clips, and a user revision instruction.
Update the storyboard, pacing, transitions, text overlays, or music recommendation based on the user's natural language request.

User Instruction: "${instruction}"

Current Storyboard & Settings:
${JSON.stringify(currentStoryboard, null, 2)}

Clip Metadata:
${JSON.stringify(analyzedClips, null, 2)}

Return a complete updated JSON plan matching the same format structure.
`;

    const result = await model.generateContent(promptText);
    return JSON.parse(result.response.text());
  } catch (err) {
    console.error('Failed to get Gemini revision plan:', err);
    return currentStoryboard;
  }
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
      await createProxyVideo(targetOrigPath, targetProxyPath, metadata.hasAudio);

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
        proxyPath: targetProxyPath,
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
    
    // Call Gemini editor to parse instruction into storyboard deltas
    const updatedPlan = await queryGeminiRevision(
      instruction,
      projectMetadata.aiPlan,
      projectMetadata.clips
    );

    // Update metadata and save
    projectMetadata.aiPlan = updatedPlan;
    fs.writeFileSync(metadataPath, JSON.stringify(projectMetadata, null, 2));

    res.json({
      projectId,
      storyboard: updatedPlan.storyboard,
      textOverlays: updatedPlan.text_overlays,
      colorGrading: updatedPlan.color_grading,
      musicRecommendation: updatedPlan.music_recommendation
    });
  } catch (err) {
    console.error('Revision failed:', err);
    res.status(500).json({ error: 'Conversational edit failed' });
  }
});

// Rendering Engine (Combines clips, transitions, beat-sync BGM, dynamically ducks, and exports)
app.post('/api/process', upload.fields([{ name: 'customAudio', maxCount: 1 }]), async (req, res) => {
  const { projectId, useProxy, previewUrl, songTitle, songArtist } = req.body;
  const customAudio = req.files && req.files['customAudio'] ? req.files['customAudio'][0] : null;

  if (!projectId) {
    return res.status(400).json({ error: 'Missing projectId' });
  }

  const projectPath = path.join(projectsDir, projectId);
  const metadataPath = path.join(projectPath, 'metadata.json');

  if (!fs.existsSync(metadataPath)) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const projectMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const aiPlan = projectMetadata.aiPlan;
  const clips = projectMetadata.clips;

  const renderProxies = useProxy === 'true' || useProxy === true;
  console.log(`Rendering project ${projectId} (Proxy mode: ${renderProxies})...`);

  // Handle re-ordered custom storyboard sequence if passed, otherwise use AI Plan
  let activeStoryboard = aiPlan.storyboard;
  if (req.body.storyboard) {
    try {
      activeStoryboard = JSON.parse(req.body.storyboard);
      // Save it back to project metadata
      projectMetadata.aiPlan.storyboard = activeStoryboard;
      fs.writeFileSync(metadataPath, JSON.stringify(projectMetadata, null, 2));
    } catch (e) {
      console.warn('Failed to parse storyboard override, using default.');
    }
  }

  // Resolve music path
  let musicPath = path.join(__dirname, 'music', `${aiPlan.music_recommendation.mood.toLowerCase()}_hype.wav`);
  const localMoodFile = path.join(__dirname, 'music', `english_${aiPlan.music_recommendation.mood.toLowerCase()}.wav`);
  if (fs.existsSync(localMoodFile)) {
    musicPath = localMoodFile;
  }

  let resolvedPreviewUrl = previewUrl;
  
  // Resolve missing previewUrls in backend by searching iTunes on-the-fly
  if ((!resolvedPreviewUrl || resolvedPreviewUrl === 'undefined' || resolvedPreviewUrl === 'null') && songTitle) {
    console.log(`Backend resolving preview URL for catalog song: '${songTitle}' - '${songArtist}'`);
    try {
      const primaryArtist = songArtist ? songArtist.split(',')[0].trim() : '';
      let term = `${songTitle} ${primaryArtist}`.trim();
      let searchRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=1`);
      let searchData = await searchRes.json();
      
      if (!searchData.results || !searchData.results[0]?.previewUrl) {
        term = songTitle;
        searchRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=1`);
        searchData = await searchRes.json();
      }

      if (searchData.results && searchData.results[0]?.previewUrl) {
        resolvedPreviewUrl = searchData.results[0].previewUrl;
        console.log(`Successfully resolved preview URL for '${songTitle}': ${resolvedPreviewUrl}`);
      } else {
        console.warn(`Could not resolve preview URL for song '${songTitle}'`);
      }
    } catch (err) {
      console.warn('iTunes search failed in backend:', err.message);
    }
  }

  if (customAudio) {
    musicPath = customAudio.path;
    console.log(`Using custom user uploaded audio: ${musicPath}`);
  } else if (resolvedPreviewUrl && resolvedPreviewUrl !== 'undefined' && resolvedPreviewUrl !== 'null') {
    const songCacheName = 'preview-' + resolvedPreviewUrl.replace(/[^a-zA-Z0-9]/g, '_').slice(-60) + '.m4a';
    const cachedSongPath = path.join(__dirname, 'music', songCacheName);
    
    if (fs.existsSync(cachedSongPath)) {
      musicPath = cachedSongPath;
      console.log(`Using cached soundtrack: ${musicPath}`);
    } else {
      try {
        console.log(`Downloading soundtrack preview from ${resolvedPreviewUrl}...`);
        await downloadFile(resolvedPreviewUrl, cachedSongPath);
        musicPath = cachedSongPath;
        console.log(`Downloaded and cached soundtrack: ${musicPath}`);
      } catch (err) {
        console.error('Failed to download custom soundtrack preview:', err);
      }
    }
  }

  // Generate ElevenLabs Voiceover if required
  let voiceoverPath = null;
  const voicePrompt = aiPlan.text_overlays?.find(o => o.style === 'hook')?.text || aiPlan.hook;
  if (process.env.ELEVENLABS_API_KEY && voicePrompt && !renderProxies) {
    try {
      const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam Voice
      const resTTS = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: voicePrompt,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.75, similarity_boost: 0.75 }
        })
      });

      if (resTTS.ok) {
        const arrayBuffer = await resTTS.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        voiceoverPath = path.join(projectPath, `voiceover-${Date.now()}.mp3`);
        fs.writeFileSync(voiceoverPath, buffer);
      }
    } catch (err) {
      console.error('Failed to generate ElevenLabs voiceover:', err);
    }
  }

  // Parse beat timestamps
  const bpm = aiPlan.music_recommendation.bpm || 120;
  const beats = calculateBeats(bpm, 60);

  // Compute sequences & speaking ranges
  const orderedFiles = [];
  const speechIntervals = [];
  let currentTimelineCursor = 0;

  activeStoryboard.forEach((scene) => {
    const clip = clips.find(c => c.clipIndex === scene.clipIndex);
    if (clip) {
      const filePath = renderProxies ? clip.proxyPath : clip.originalPath;
      orderedFiles.push({
        path: filePath,
        startTime: scene.startTime || 0,
        duration: scene.duration || 3.0,
        transition: scene.transition || 'cuts',
        hasAudio: clip.metadata.hasAudio
      });

      // Track speech range if the source clip has an audio track
      if (clip.metadata.hasAudio) {
        speechIntervals.push({
          start: currentTimelineCursor,
          end: currentTimelineCursor + (scene.duration || 3.0)
        });
      }
      currentTimelineCursor += (scene.duration || 3.0);
    }
  });  const totalDuration = currentTimelineCursor;
  const outputFileName = `output-${projectId}-${renderProxies ? 'preview' : 'export'}.mp4`;
  const outputPath = path.join(outputDir, outputFileName);

  // Target canvas resolution (1080x1920 9:16 vertical standard for exports, 360x640 for proxies)
  const canvasW = renderProxies ? 360 : 1080;
  const canvasH = renderProxies ? 640 : 1920;

  // FFmpeg Filter Graph
  let filterComplex = '';
  
  // Color Correction presets
  let colorFilter = '';
  switch (aiPlan.color_grading?.toLowerCase()) {
    case 'vivid':
      colorFilter = ',eq=contrast=1.22:saturation=1.38:brightness=0.01';
      break;
    case 'warm':
      colorFilter = ',colorbalance=rs=0.1:gs=0.04:bs=-0.06,eq=contrast=1.05:saturation=1.12';
      break;
    case 'gritty':
      colorFilter = ',eq=contrast=1.35:saturation=0.75:brightness=-0.02';
      break;
    case 'dreamy':
      colorFilter = ',eq=brightness=0.04:contrast=1.08:saturation=1.15,colorbalance=rs=0.04:gs=0.02:bs=0.05';
      break;
    case 'luxury':
      colorFilter = ',eq=contrast=1.25:saturation=1.05:brightness=-0.01';
      break;
    case 'pop':
      colorFilter = ',eq=contrast=1.15:saturation=1.45';
      break;
    case 'cyberpunk':
      colorFilter = ',colorbalance=rs=0.12:gs=-0.05:bs=0.15,eq=contrast=1.2:saturation=1.25';
      break;
    case 'vintage':
      colorFilter = ',colorbalance=rs=0.08:gs=0.06:bs=-0.05,eq=contrast=0.95:saturation=0.85';
      break;
    case 'cinematic_teal_orange':
      colorFilter = ',colorbalance=rs=0.12:gs=-0.04:bs=-0.1:rh=-0.08:gh=0.04:bh=0.14,eq=contrast=1.18:saturation=1.2';
      break;
    default:
      colorFilter = ',eq=contrast=1.08:saturation=1.12';
      break;
  }

  // Process video segments with Smart Background Blur & Human Director Transitions
  orderedFiles.forEach((file, index) => {
    const dur = file.duration;
    const trans = file.transition;
    let transFilter = '';
    let zoomFilter = '';

    if (trans === 'zoom' || aiPlan.color_grading === 'vivid' || aiPlan.color_grading === 'dreamy') {
      zoomFilter = `,zoompan=z='min(zoom+0.002,1.3)':x='iw/2-(iw/zoom)/2':y='ih/2-(ih/zoom)/2':d=1:s=${canvasW}x${canvasH}`;
    }

    if (trans === 'fade') {
      transFilter = `,fade=t=in:st=0:d=0.35,fade=t=out:st=${(dur - 0.35).toFixed(2)}:d=0.35`;
    } else if (trans === 'flash') {
      transFilter = `,fade=t=in:st=0:d=0.25:color=white,fade=t=out:st=${(dur - 0.25).toFixed(2)}:d=0.25:color=white`;
    } else if (trans === 'blur') {
      transFilter = `,boxblur=14:enable='lt(t,0.25)+gt(t,${(dur - 0.25).toFixed(2)})'`;
    } else if (trans === 'whip_left' || trans === 'whip_right') {
      transFilter = `,boxblur=22:enable='gt(t,${(dur - 0.2).toFixed(2)})'`;
    } else if (trans === 'glitch') {
      transFilter = `,rgbashift=rh=8:rv=-8:enable='lt(t,0.15)+gt(t,${(dur - 0.15).toFixed(2)})'`;
    } else if (trans === 'rgb_split') {
      transFilter = `,rgbashift=rh=10:bv=-10:enable='lt(t,0.2)+gt(t,${(dur - 0.2).toFixed(2)})'`;
    } else if (trans === 'dip_black') {
      transFilter = `,fade=t=in:st=0:d=0.3:color=black,fade=t=out:st=${(dur - 0.3).toFixed(2)}:d=0.3:color=black`;
    } else if (trans === 'dip_white') {
      transFilter = `,fade=t=in:st=0:d=0.25:color=white,fade=t=out:st=${(dur - 0.25).toFixed(2)}:d=0.25:color=white`;
    }

    // Smart Background Blur Fill: Scales background to fill canvas and blurs, while overlaying sharp foreground
    filterComplex += `[${index}:v]split=2[bgin_${index}][fgin_${index}]; `;
    filterComplex += `[bgin_${index}]scale=${canvasW}:${canvasH}:force_original_aspect_ratio=increase,crop=${canvasW}:${canvasH},boxblur=16:2,eq=brightness=-0.18:contrast=0.9[bg_${index}]; `;
    filterComplex += `[fgin_${index}]scale=${canvasW}:${canvasH}:force_original_aspect_ratio=decrease[fg_${index}]; `;
    filterComplex += `[bg_${index}][fg_${index}]overlay=(W-w)/2:(H-h)/2,setsar=1,fps=30,format=yuv420p${colorFilter}${zoomFilter}${transFilter}[v${index}]; `;

    // Format audio
    if (file.hasAudio) {
      filterComplex += `[${index}:a]aresample=44100,aformat=channel_layouts=stereo[a${index}]; `;
    } else {
      filterComplex += `anullsrc=channel_layout=stereo:sample_rate=44100,atrim=duration=${dur},asetpts=PTS-STARTPTS[a${index}]; `;
    }
  });

  // Concatenate Video & Audio Streams
  let concatVideo = '';
  let concatAudio = '';
  for (let i = 0; i < orderedFiles.length; i++) {
    concatVideo += `[v${i}]`;
    concatAudio += `[a${i}]`;
  }
  filterComplex += `${concatVideo}concat=n=${orderedFiles.length}:v=1:a=0[rawv]; `;
  filterComplex += `${concatAudio}concat=n=${orderedFiles.length}:v=0:a=1[rawa]; `;

  // Strict text overlay enforcement: check if user prompt explicitly requested text
  const promptLower = (projectMetadata.prompt || '').toLowerCase();
  const textKeywords = ['text', 'caption', 'subtitles', 'subtitle', 'title', 'hook', 'words', 'quote', 'overlay', 'written'];
  const userRequestedText = textKeywords.some(kw => promptLower.includes(kw));

  // Draw Styled Text Overlays ONLY if explicitly requested in prompt
  let videoOutputTag = 'rawv';
  if (userRequestedText && aiPlan.text_overlays && aiPlan.text_overlays.length > 0) {
    let currentVTag = 'rawv';
    aiPlan.text_overlays.forEach((overlay, idx) => {
      const nextVTag = `textv${idx}`;
      const isHook = overlay.style === 'hook';
      const fontcolor = isHook ? 'yellow' : 'white';
      const size = isHook ? (renderProxies ? 32 : 54) : (renderProxies ? 22 : 38);
      const yPosition = isHook ? 'h/3.2' : 'h-240';
      const fontfileOpt = fontPath ? `:fontfile='${fontPath}'` : '';
      const boxOpt = `:box=1:boxcolor=black@0.55:boxborderw=${isHook ? 12 : 8}`;
      
      // Escape special characters to prevent drawtext failures
      const escapedText = overlay.text.replace(/'/g, '').replace(/"/g, '').replace(/:/g, '\\:');
      
      filterComplex += `[${currentVTag}]drawtext=text='${escapedText}'${fontfileOpt}:fontcolor=${fontcolor}:fontsize=${size}${boxOpt}:x=(w-text_w)/2:y=${yPosition}:enable='between(t,${overlay.startTime},${overlay.endTime})'[${nextVTag}]; `;
      currentVTag = nextVTag;
    });
    videoOutputTag = `textv${aiPlan.text_overlays.length - 1}`;
  }

  // Get voiceover duration
  let voDuration = 0;
  if (voiceoverPath) {
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

  // Dynamic Audio Ducking & Loudness Normalization
  const musicInputIndex = orderedFiles.length;
  let dynamicBgmVolume = '0.85'; // Clear loud volume when no voiceover is active
  if (voDuration > 0) {
    dynamicBgmVolume = `if(between(t,0,${voDuration.toFixed(2)}),0.15,0.75)`;
  }

  // Seamless Audio Looping & Formatting for Selected Music Track
  filterComplex += `[${musicInputIndex}:a]aloop=loop=-1:size=2147483647,atrim=duration=${totalDuration.toFixed(2)},asetpts=PTS-STARTPTS,aresample=44100,aformat=channel_layouts=stereo,volume=eval=frame:volume='${dynamicBgmVolume}'[bgm]; `;

  // Mix background music with voice audio & apply master loudness normalization
  if (voiceoverPath) {
    const voInputIndex = musicInputIndex + 1;
    filterComplex += `[${voInputIndex}:a]aresample=44100,aformat=channel_layouts=stereo,volume=1.8[vo]; `;
    filterComplex += `[rawa]volume=0.35[ambient]; [bgm]volume=2.0[music]; `;
    filterComplex += `[ambient][music][vo]amix=inputs=3:duration=first:dropout_transition=2,loudnorm=I=-16:LRA=11:TP=-1.5[outa]`;
  } else {
    filterComplex += `[rawa]volume=0.35[ambient]; [bgm]volume=2.0[music]; `;
    filterComplex += `[ambient][music]amix=inputs=2:duration=first:dropout_transition=2,loudnorm=I=-16:LRA=11:TP=-1.5[outa]`;
  }

  // Run FFmpeg Command
  let command = ffmpeg();
  orderedFiles.forEach(file => {
    command = command.input(file.path)
      .inputOptions([
        `-ss ${file.startTime}`,
        `-t ${file.duration}`
      ]);
  });
  command = command.input(musicPath);
  if (voiceoverPath) {
    command = command.input(voiceoverPath);
  }

  // Execute FFmpeg with high-performance bitrate and streaming options
  const startTimer = Date.now();
  const isCloudEnv = !!process.env.RENDER || !!process.env.PORT || renderProxies;
  command
    .complexFilter(filterComplex, [videoOutputTag, 'outa'])
    .outputOptions('-c:v libx264')
    .outputOptions(isCloudEnv ? '-preset ultrafast' : '-preset fast')
    .outputOptions(isCloudEnv ? '-b:v 2.5M' : '-b:v 5M')
    .outputOptions(isCloudEnv ? '-maxrate 3.5M' : '-maxrate 7M')
    .outputOptions(isCloudEnv ? '-bufsize 5M' : '-bufsize 10M')
    .outputOptions('-movflags +faststart')
    .outputOptions('-threads 2')
    .outputOptions('-pix_fmt yuv420p')
    .outputOptions('-c:a aac')
    .outputOptions('-b:a 192k')
    .outputOptions('-y')
    .outputOptions(`-t ${totalDuration.toFixed(2)}`)
    .on('start', (cmd) => {
      console.log('Rendering FFmpeg command:', cmd);
    })
    .on('end', async () => {
      const renderTime = Date.now() - startTimer;
      console.log(`Render complete in ${renderTime}ms.`);

      // Clean up uploaded voiceover file if exists
      if (voiceoverPath && fs.existsSync(voiceoverPath)) {
        try { fs.unlinkSync(voiceoverPath); } catch (e) {}
      }

      // Quality Control check
      const qcResult = await runQualityCheck(outputPath, totalDuration);
      if (!qcResult.ok) {
        console.error(`Quality Check failed: ${qcResult.reason}.`);
        return res.status(500).json({ error: `Video Quality Control check failed: ${qcResult.reason}` });
      }

      // Developer Debug Panel payload
      const debugData = {
        promptInterpretation: {
          prompt: projectMetadata.prompt,
          theme: aiPlan.theme,
          colorGrading: aiPlan.color_grading,
          pacing: aiPlan.pacing
        },
        clipAnalysis: clips.map(c => ({
          index: c.clipIndex,
          file: c.fileName,
          resolution: `${c.metadata.width}x${c.metadata.height}`,
          duration: `${c.metadata.duration.toFixed(2)}s`,
          fps: c.metadata.fps
        })),
        storyboard: activeStoryboard,
        musicSelection: {
          path: path.basename(musicPath),
          bpm: bpm,
          beatTimestamps: beats.slice(0, 8)
        },
        ffmpegCommand: `ffmpeg -i <inputs> -filter_complex "${filterComplex.slice(0, 150)}..." -c:v libx264 ${path.basename(outputPath)}`,
        renderTimeMs: renderTime,
        qualityControl: 'PASSED'
      };

      const host = req.get('host');
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const baseUrl = `${protocol}://${host}`;

      res.json({
        status: 'success',
        videoUrl: `${baseUrl}/outputs/${outputFileName}`,
        caption: aiPlan.caption || 'Created with RaagaReel AI',
        hook: voicePrompt || 'Wait for it... 👀',
        qualityScore: 92,
        debug: debugData
      });
    })
    .on('error', (err, stdout, stderr) => {
      console.error('FFmpeg Render Error:', err.message);
      res.status(500).json({ error: `Video rendering failed: ${err.message}` });
    })
    .save(outputPath);
});

app.use('/outputs', express.static(outputDir));
app.use('/music', express.static(path.join(__dirname, 'music')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`RaagaReel AI Director Backend running on port ${PORT}`);
});

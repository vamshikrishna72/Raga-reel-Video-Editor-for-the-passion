const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, 'uploads');

const targets = [
  '8.22.59_AM_(1)',
  '6.19.19_PM',
  '8.22.18_AM',
  '8.22.59_AM',
  '8.21.36_AM'
];

function findClips() {
  const files = fs.readdirSync(uploadsDir);
  const found = [];
  
  for (const t of targets) {
    // Find the first file that contains the target substring and doesn't contain 'output'
    const match = files.find(f => f.includes(t) && !f.includes('output') && f.endsWith('.mp4'));
    if (match) {
      found.push(path.join(uploadsDir, match));
    }
  }
  return found;
}

async function runTest() {
  console.log('Locating college memory clips...');
  const clips = findClips();
  if (clips.length < 5) {
    console.error(`Error: Could only find ${clips.length} of 5 required clips.`);
    console.log('Found:', clips);
    process.exit(1);
  }
  
  console.log('Found 5 clips:');
  clips.forEach(c => console.log(' -', path.basename(c)));

  const fileBlobs = clips.map(c => {
    const buf = fs.readFileSync(c);
    return new Blob([buf], { type: 'video/mp4' });
  });

  console.log('\n--- STEP 1: AI Storyboard Analysis ---');
  const analyzeForm = new FormData();
  fileBlobs.forEach((blob, idx) => {
    analyzeForm.append('files', blob, path.basename(clips[idx]));
  });
  analyzeForm.append('prompt', 'Create a 20-second emotional cinematic college memories reel, begin energetic, preserve important voices, transition into nostalgia, and automatically select suitable music.');
  analyzeForm.append('mood', 'emotional');
  analyzeForm.append('language', 'english');

  let projectId;
  let storyboard;
  let musicRec;

  try {
    const res = await fetch('http://localhost:3001/api/analyze', {
      method: 'POST',
      body: analyzeForm
    });

    if (!res.ok) {
      throw new Error(`Analyze failed: ${await res.text()}`);
    }

    const data = await res.json();
    console.log('Analysis Success!');
    console.log('Project ID:', data.projectId);
    console.log('AI Recommended Music:', data.musicRecommendation);
    console.log('Color Grading:', data.colorGrading);
    console.log('Storyboard:', JSON.stringify(data.storyboard, null, 2));

    projectId = data.projectId;
    storyboard = data.storyboard;
    musicRec = data.musicRecommendation;
  } catch (err) {
    console.error('Analyze request failed:', err.message);
    process.exit(1);
  }

  // Force total storyboard duration to match user's requested 20s limit exactly
  let totalDur = storyboard.reduce((acc, s) => acc + s.duration, 0);
  console.log(`Current narrative duration: ${totalDur.toFixed(2)}s`);
  if (Math.abs(totalDur - 20) > 0.1) {
    console.log('Scaling scene durations to fit exactly 20.0 seconds target...');
    const scale = 20 / totalDur;
    storyboard = storyboard.map(s => ({
      ...s,
      duration: parseFloat((s.duration * scale).toFixed(2))
    }));
    totalDur = storyboard.reduce((acc, s) => acc + s.duration, 0);
    console.log(`New target duration: ${totalDur.toFixed(2)}s`);
  }

  console.log('\n--- STEP 2: Rendering Final High-Quality Export ---');
  const exportForm = new FormData();
  exportForm.append('projectId', projectId);
  exportForm.append('storyboard', JSON.stringify(storyboard));
  exportForm.append('useProxy', 'false'); // High Quality

  try {
    const res = await fetch('http://localhost:3001/api/process', {
      method: 'POST',
      body: exportForm
    });

    if (!res.ok) {
      throw new Error(`Render failed: ${await res.text()}`);
    }

    const data = await res.json();
    console.log('Render Success!');
    console.log('Exported Video URL:', data.videoUrl);
    console.log('Quality Score:', data.qualityScore);
    console.log('Quality Control Status:', data.debug?.qualityControl);
    console.log('Total Render Time:', data.debug?.renderTimeMs, 'ms');
  } catch (err) {
    console.error('Render request failed:', err.message);
    process.exit(1);
  }
}

runTest();

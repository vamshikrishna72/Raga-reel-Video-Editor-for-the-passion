const fs = require('fs');
const path = require('path');

async function runTest() {
  console.log('=== Starting E2E AI Director Pipeline Integration Test ===');
  
  const sample1Path = path.join(__dirname, '..', 'sample1.mp4');
  const sample2Path = path.join(__dirname, '..', 'sample2.mp4');

  if (!fs.existsSync(sample1Path) || !fs.existsSync(sample2Path)) {
    console.error('Error: sample1.mp4 or sample2.mp4 missing from project root.');
    process.exit(1);
  }

  // Load files into native Blobs
  const file1Buffer = fs.readFileSync(sample1Path);
  const file2Buffer = fs.readFileSync(sample2Path);
  const blob1 = new Blob([file1Buffer], { type: 'video/mp4' });
  const blob2 = new Blob([file2Buffer], { type: 'video/mp4' });

  // 1. Test /api/analyze (Upload & Multimodal Curation)
  console.log('\n--- PHASE 1: Uploading and analyzing raw footage ---');
  const analyzeForm = new FormData();
  analyzeForm.append('files', blob1, 'sample1.mp4');
  analyzeForm.append('files', blob2, 'sample2.mp4');
  analyzeForm.append('prompt', 'Create an energetic gym workout compilation');
  analyzeForm.append('mood', 'motivation');
  analyzeForm.append('language', 'english');

  let projectId;
  let storyboard;
  try {
    const res = await fetch('http://localhost:3001/api/analyze', {
      method: 'POST',
      body: analyzeForm
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Analyze endpoint failed with status ${res.status}: ${errText}`);
    }

    const data = await res.json();
    console.log('Analysis Success!');
    console.log('Project ID:', data.projectId);
    console.log('AI Recommended Song:', data.musicRecommendation);
    console.log('Generated Storyboard Scenes count:', data.storyboard.length);
    projectId = data.projectId;
    storyboard = data.storyboard;
  } catch (err) {
    console.error('Analyze failed:', err.message);
    process.exit(1);
  }

  // 2. Test /api/process (Compile low-res Proxy Preview)
  console.log('\n--- PHASE 2: Rendering fast low-res proxy preview ---');
  const previewForm = new FormData();
  previewForm.append('projectId', projectId);
  previewForm.append('storyboard', JSON.stringify(storyboard));
  previewForm.append('useProxy', 'true'); // proxy mode

  try {
    const res = await fetch('http://localhost:3001/api/process', {
      method: 'POST',
      body: previewForm
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Proxy rendering failed: ${errText}`);
    }

    const data = await res.json();
    console.log('Proxy Preview Render Success!');
    console.log('Preview Video URL:', data.videoUrl);
    console.log('Quality Score:', data.qualityScore);
    console.log('Pacing Details:', data.debug?.musicSelection?.bpm, 'BPM');
  } catch (err) {
    console.error('Proxy render failed:', err.message);
    process.exit(1);
  }

  // 3. Test /api/reedit (Conversational Revision)
  console.log('\n--- PHASE 3: Testing Natural Language revision ---');
  try {
    const res = await fetch('http://localhost:3001/api/reedit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        instruction: 'Make the first scene faster and use a gritty filter'
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Revision failed: ${errText}`);
    }

    const data = await res.json();
    console.log('Conversational Revision success!');
    console.log('Revised Storyboard Scene 1 Duration:', data.storyboard[0].duration);
    console.log('Revised Color Grade:', data.colorGrading);
    storyboard = data.storyboard; // update storyboard reference
  } catch (err) {
    console.error('Revision failed:', err.message);
    process.exit(1);
  }

  // 4. Test /api/process (Compile Final High-Quality Export)
  console.log('\n--- PHASE 4: Rendering final high-quality export from original files ---');
  const exportForm = new FormData();
  exportForm.append('projectId', projectId);
  exportForm.append('storyboard', JSON.stringify(storyboard));
  exportForm.append('useProxy', 'false'); // high quality

  try {
    const res = await fetch('http://localhost:3001/api/process', {
      method: 'POST',
      body: exportForm
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Export rendering failed: ${errText}`);
    }

    const data = await res.json();
    console.log('Export Render Success!');
    console.log('Exported High Quality Video URL:', data.videoUrl);
    console.log('QC check verification status:', data.debug?.qualityControl);
  } catch (err) {
    console.error('Export failed:', err.message);
    process.exit(1);
  }

  console.log('\n\x1b[32m=== All integration tests successfully completed! ===\x1b[0m');
}

runTest();

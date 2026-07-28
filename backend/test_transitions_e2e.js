const fs = require('fs');
const path = require('path');

async function testTransitionsAPI() {
  console.log('=== Starting E2E Transition Test ===');
  
  const sample1Path = path.join(__dirname, '..', 'sample1.mp4');
  const sample2Path = path.join(__dirname, '..', 'sample2.mp4');
  
  if (!fs.existsSync(sample1Path) || !fs.existsSync(sample2Path)) {
    console.error('Error: sample1.mp4 or sample2.mp4 missing from project root.');
    process.exit(1);
  }
  
  const file1Buffer = fs.readFileSync(sample1Path);
  const file2Buffer = fs.readFileSync(sample2Path);
  
  const formData = new FormData();
  // Append mock files as blobs
  formData.append('files', new Blob([file1Buffer], { type: 'video/mp4' }), 'sample1.mp4');
  formData.append('files', new Blob([file2Buffer], { type: 'video/mp4' }), 'sample2.mp4');
  formData.append('prompt', 'Cinematic travel adventure');
  formData.append('mood', 'Travel');
  formData.append('language', 'English');
  formData.append('transition', 'flash'); // Testing Flash Transition
  
  console.log('Sending multipart request to http://localhost:3001/api/process with transition = "flash"...');
  
  try {
    const res = await fetch('http://localhost:3001/api/process', {
      method: 'POST',
      body: formData
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('\n\x1b[32m[Success] E2E Transition Test Completed successfully!\x1b[0m');
      console.log('Response data:', data);
      
      // Let's verify output file exists
      const outputFilename = path.basename(data.videoUrl);
      const outputPath = path.join(__dirname, 'outputs', outputFilename);
      if (fs.existsSync(outputPath)) {
        console.log(`\x1b[32mVerified output file exists at: ${outputPath} (${fs.statSync(outputPath).size} bytes)\x1b[0m`);
      } else {
        console.log('\x1b[31mError: Output file not found in outputs directory.\x1b[0m');
      }
    } else {
      const errText = await res.text();
      console.error(`\x1b[31m[Failed] API responded with status ${res.status}\x1b[0m`);
      console.error('Response:', errText);
    }
  } catch (err) {
    console.error('\x1b[31m[Failed] Connection Error during API call:\x1b[0m', err.message);
  }
}

testTransitionsAPI();

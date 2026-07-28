const fs = require('fs');
const path = require('path');

// Load environment variables from backend/.env
const dotenvPath = path.join(__dirname, '.env');
if (fs.existsSync(dotenvPath)) {
  require('dotenv').config({ path: dotenvPath });
} else {
  console.log('\x1b[31m[Error] backend/.env file not found!\x1b[0m');
  process.exit(1);
}

const geminiKey = process.env.GEMINI_API_KEY;
const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

console.log('\x1b[36m=== RaagaReel API Keys Validation ===\x1b[0m\n');

async function testGemini() {
  if (!geminiKey) {
    console.log('GEMINI_API_KEY: \x1b[33m[Missing] (Skipped testing)\x1b[0m');
    return false;
  }
  
  // Truncated display for security
  const maskedKey = geminiKey.length > 8 ? `${geminiKey.slice(0, 4)}...${geminiKey.slice(-4)}` : 'Invalid Length';
  console.log(`Testing GEMINI_API_KEY (${maskedKey})...`);
  
  try {
    const requestBody = {
      contents: [{
        parts: [{
          text: 'Hi'
        }]
      }]
    };
    
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.candidates && data.candidates[0]) {
        console.log('GEMINI_API_KEY: \x1b[32m[Working] (Creative Director API responded successfully)\x1b[0m');
        return true;
      }
    }
    
    const errText = await res.text();
    console.log(`GEMINI_API_KEY: \x1b[31m[Failed] (Status ${res.status})\x1b[0m`);
    console.log(`Response: ${errText}`);
    return false;
  } catch (err) {
    console.log(`GEMINI_API_KEY: \x1b[31m[Failed] (Connection Error)\x1b[0m`);
    console.error(err);
    return false;
  }
}

async function testElevenLabs() {
  if (!elevenLabsKey) {
    console.log('ELEVENLABS_API_KEY: \x1b[33m[Missing] (Skipped testing)\x1b[0m');
    return false;
  }
  
  const maskedKey = elevenLabsKey.length > 8 ? `${elevenLabsKey.slice(0, 4)}...${elevenLabsKey.slice(-4)}` : 'Invalid Length';
  console.log(`Testing ELEVENLABS_API_KEY (${maskedKey})...`);
  
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/user', {
      method: 'GET',
      headers: {
        'xi-api-key': elevenLabsKey
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log(`ELEVENLABS_API_KEY: \x1b[32m[Working] (Voiceover API responded successfully. User tier: ${data.subscription?.tier || 'N/A'})\x1b[0m`);
      return true;
    }
    
    const errText = await res.text();
    console.log(`ELEVENLABS_API_KEY: \x1b[31m[Failed] (Status ${res.status})\x1b[0m`);
    console.log(`Response: ${errText}`);
    return false;
  } catch (err) {
    console.log(`ELEVENLABS_API_KEY: \x1b[31m[Failed] (Connection Error)\x1b[0m`);
    console.error(err);
    return false;
  }
}

async function main() {
  await testGemini();
  console.log('');
  await testElevenLabs();
  console.log('\n\x1b[36m=====================================\x1b[0m');
}

main();

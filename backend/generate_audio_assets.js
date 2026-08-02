const fs = require('fs');
const path = require('path');

const LANGUAGES = ['telugu', 'hindi', 'tamil', 'kannada', 'malayalam', 'english', 'punjabi'];
const MOODS = ['emotional', 'hype', 'romantic', 'cinematic', 'travel', 'motivation', 'chill'];

function createWavBuffer(samples, sampleRate = 8000) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  
  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write('WAVE', 8);
  
  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(1, 22); // Mono channel
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // Byte rate (SampleRate * 2)
  buffer.writeUInt16LE(2, 32); // Block align
  buffer.writeUInt16LE(16, 34); // 16-bit
  
  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  
  // Write samples
  for (let i = 0; i < samples.length; i++) {
    buffer.writeInt16LE(samples[i], 44 + i * 2);
  }
  
  return buffer;
}

function generateSamples(mood, durationSec = 10, sampleRate = 8000) {
  const numSamples = sampleRate * durationSec;
  const samples = new Int16Array(numSamples);
  const maxAmplitude = 16000; // max safe volume to avoid clipping

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let val = 0;

    switch (mood) {
      case 'hype': {
        const pulse = Math.floor(t * 5.5) % 2;
        if (pulse === 0) {
          const f = t % 0.36 < 0.18 ? 80 : 350;
          val = Math.sin(2 * Math.PI * f * t) * maxAmplitude;
        } else {
          val = (Math.random() - 0.5) * (maxAmplitude * 0.15);
        }
        break;
      }
      case 'emotional': {
        const f1 = 220 + Math.sin(2 * Math.PI * 0.2 * t) * 20;
        const f2 = 277.18 + Math.sin(2 * Math.PI * 0.15 * t) * 15;
        val = (Math.sin(2 * Math.PI * f1 * t) * 0.5 + Math.sin(2 * Math.PI * f2 * t) * 0.5) * maxAmplitude;
        break;
      }
      case 'romantic': {
        const f = 261.63 + Math.sin(2 * Math.PI * 0.1 * t) * 30;
        val = Math.sin(2 * Math.PI * f * t) * maxAmplitude * 0.8;
        break;
      }
      case 'cinematic': {
        const f = 110 + Math.sin(2 * Math.PI * 0.05 * t) * 40;
        const brass = Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2 * t);
        val = Math.max(-1, Math.min(1, brass)) * maxAmplitude * 0.85;
        break;
      }
      case 'travel': {
        const f1 = 330;
        const f2 = 392;
        const rhythm = Math.floor(t * 3) % 2 === 0 ? f1 : f2;
        val = Math.sin(2 * Math.PI * rhythm * t) * maxAmplitude * 0.7;
        break;
      }
      case 'motivation': {
        const f = 146.83 + (t % 2) * 50;
        val = (Math.sin(2 * Math.PI * f * t) > 0 ? 0.7 : -0.7) * maxAmplitude * 0.6;
        break;
      }
      case 'chill':
      default: {
        const f = 174.61 + Math.sin(2 * Math.PI * 0.08 * t) * 10;
        val = Math.sin(2 * Math.PI * f * t) * maxAmplitude * 0.6;
        break;
      }
    }

    samples[i] = Math.max(-32768, Math.min(32767, val));
  }

  return samples;
}

function generateAllAssets() {
  const musicDir = path.join(__dirname, 'music');
  if (!fs.existsSync(musicDir)) {
    fs.mkdirSync(musicDir, { recursive: true });
  }

  for (const language of LANGUAGES) {
    for (const mood of MOODS) {
      const fileName = `${language}_${mood}.wav`;
      const filePath = path.join(musicDir, fileName);
      if (fs.existsSync(filePath)) continue;
      
      const samples = generateSamples(mood, 15, 8000);
      const buffer = createWavBuffer(samples, 8000);
      fs.writeFileSync(filePath, buffer);
    }
  }
}

module.exports = { generateAllAssets };

if (require.main === module) {
  generateAllAssets();
}

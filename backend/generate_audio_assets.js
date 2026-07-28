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
        // Fast, high-energy pulsing beat
        const pulse = Math.floor(t * 5.5) % 2; // ~165 BPM pulse
        if (pulse === 0) {
          // Pulse on: alternating bass kick and synth tone
          const f = t % 0.36 < 0.18 ? 80 : 350;
          val = Math.sin(2 * Math.PI * f * t) * maxAmplitude;
        } else {
          // Pulse off: quiet snare hiss
          val = (Math.random() - 0.5) * (maxAmplitude * 0.15);
        }
        break;
      }
      case 'emotional': {
        // Slow warm flowing pad/chord
        // A2 (110Hz) + C#3 (138Hz) + E3 (165Hz)
        val = (Math.sin(2 * Math.PI * 110 * t) +
               Math.sin(2 * Math.PI * 138 * t) +
               Math.sin(2 * Math.PI * 165 * t)) / 3 * maxAmplitude;
        // Fade in/out slightly to sound smooth
        const envelope = Math.sin(Math.PI * t / durationSec);
        val *= envelope;
        break;
      }
      case 'romantic': {
        // Sweet mid-frequency alternating melody
        // E4 (330Hz) and G#4 (415Hz)
        const notes = [330, 415, 330, 494]; // E4, G#4, E4, B4
        const noteIdx = Math.floor(t * 1.5) % notes.length;
        const currentFreq = notes[noteIdx];
        val = Math.sin(2 * Math.PI * currentFreq * t) * maxAmplitude * 0.7;
        
        // Add a soft sub-octave support
        val += Math.sin(2 * Math.PI * (currentFreq / 2) * t) * maxAmplitude * 0.3;
        break;
      }
      case 'cinematic': {
        // Deep epic bass drone with rising sweep
        const baseFreq = 55; // A1
        const sweep = Math.sin(t * 0.2) * 10; // slow sweep modulation
        val = (Math.sin(2 * Math.PI * (baseFreq + sweep) * t) + 
               Math.sin(2 * Math.PI * (baseFreq * 2 + sweep) * t) * 0.5) * maxAmplitude;
        break;
      }
      case 'travel': {
        // Light, bouncy arpeggio
        const notes = [220, 275, 330, 440]; // A3, C#4, E4, A4
        const noteIdx = Math.floor(t * 4) % notes.length;
        const currentFreq = notes[noteIdx];
        val = Math.sin(2 * Math.PI * currentFreq * t) * maxAmplitude * 0.7;
        
        // Bouncy pluck envelope
        const pluck = 1.0 - ((t * 4) % 1.0);
        val *= pluck;
        break;
      }
      case 'motivation': {
        // Fast rising sweeps
        const speed = t % 1.0; // rises every second
        const f = 150 + speed * 250;
        val = Math.sin(2 * Math.PI * f * t) * maxAmplitude;
        break;
      }
      case 'chill':
      default: {
        // Binaural relaxation wave (220Hz + 221Hz)
        val = (Math.sin(2 * Math.PI * 220 * t) + Math.sin(2 * Math.PI * 221 * t)) / 2 * maxAmplitude;
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

  console.log('Generating audio assets for moods & languages...');
  
  for (const language of LANGUAGES) {
    for (const mood of MOODS) {
      const fileName = `${language}_${mood}.wav`;
      const filePath = path.join(musicDir, fileName);
      
      // Let's generate a 15-second track to be safe with longer videos
      const samples = generateSamples(mood, 15, 8000);
      const buffer = createWavBuffer(samples, 8000);
      
      fs.writeFileSync(filePath, buffer);
    }
  }
  console.log(`Successfully generated ${LANGUAGES.length * MOODS.length} audio tracks in ${musicDir}`);
}

module.exports = { generateAllAssets };

if (require.main === module) {
  generateAllAssets();
}

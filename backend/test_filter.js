const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

let command = ffmpeg();
const files = [
  '../sample1.mp4',
  '../sample1.mp4',
  '../sample1.mp4',
  '../sample1.mp4'
];

files.forEach(file => {
  command = command.input(file);
});
command = command.input('music/english_hype.wav');

const clipDuration = 1.85;
const musicInputIndex = 4;
const totalDuration = clipDuration * 4; // no transitions overlap

let filterComplex = '';

// 1. Process individual video & audio streams
files.forEach((file, index) => {
  filterComplex += `[${index}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p,trim=duration=${clipDuration},setpts=PTS-STARTPTS[v${index}]; `;
  filterComplex += `[${index}:a]aresample=44100,aformat=channel_layouts=stereo,atrim=duration=${clipDuration},asetpts=PTS-STARTPTS,volume=1.0[a${index}]; `;
});

// 2. Concat video
let concatVideoInputs = '';
for (let i = 0; i < files.length; i++) {
  concatVideoInputs += `[v${i}]`;
}
filterComplex += `${concatVideoInputs}concat=n=${files.length}:v=1:a=0[outv_raw]; `;

// 3. Burn in modern AI captions / hooks
filterComplex += `[outv_raw]drawtext=text='Test':fontcolor=white:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2-100:enable='between(t,0,2.5)'[outv]; `;

// 4. Concat audio
let concatAudioInputs = '';
for (let i = 0; i < files.length; i++) {
  concatAudioInputs += `[a${i}]`;
}
filterComplex += `${concatAudioInputs}concat=n=${files.length}:v=0:a=1[outa_orig]; `;

// 5. Trim background music and apply fadeout
filterComplex += `[${musicInputIndex}:a]aresample=44100,aformat=channel_layouts=stereo,atrim=duration=${totalDuration.toFixed(2)},asetpts=PTS-STARTPTS,afade=t=out:st=${(totalDuration - 1.0).toFixed(2)}:d=1.0,volume=0.22[bgm]; `;

// 6. Mix original audio with background music
filterComplex += `[outa_orig][bgm]amix=inputs=2:duration=first:dropout_transition=2[outa]`;

command
  .complexFilter(filterComplex, ['outv', 'outa'])
  .outputOptions('-c:v libx264')
  .outputOptions('-preset fast')
  .outputOptions('-pix_fmt yuv420p')
  .outputOptions('-c:a aac')
  .outputOptions('-b:a 128k')
  .on('start', (cmd) => console.log('Running command:', cmd))
  .on('end', () => console.log('Success!'))
  .on('error', (err, stdout, stderr) => {
    console.error('FFmpeg Error:', err);
    console.error('stderr:', stderr);
  })
  .save('test_output_4.mp4');

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

let command = ffmpeg();
let filterComplex = '';
let concatInputs = '';

const files = [
  'uploads/1777198478790-YTDown.com_YouTube_Best-House-Warming-invitation-video-gruh_Media_s_uVNSWBD74_002_720p.mp4',
  'uploads/1777198478916-WhatsApp_Video_2026-04-19_at_3.08.02_PM.mp4'
];

files.forEach((file, index) => {
  command = command.input(file);
  filterComplex += `[${index}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p,trim=duration=3,setpts=PTS-STARTPTS[v${index}]; `;
  concatInputs += `[v${index}]`;
});

filterComplex += `${concatInputs}concat=n=2:v=1:a=0[outv]`;

command
  .complexFilter(filterComplex, ['outv'])
  .outputOptions('-c:v libx264')
  .outputOptions('-preset fast')
  .outputOptions('-pix_fmt yuv420p')
  .on('end', () => console.log('Success!'))
  .on('error', (err) => console.error('FFmpeg Error:', err))
  .save('test_output.mp4');

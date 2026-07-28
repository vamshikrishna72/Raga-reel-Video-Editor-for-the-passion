import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Cpu } from 'lucide-react';
import { renderVideo } from '../services/api';
import type { Song } from '../services/musicCatalog';

const initialLogs = [
  { text: "Initializing AI Director Engine...", done: true },
  { text: "Reading project workspace state...", done: false },
  { text: "Syncing narrative story arc beats...", done: false },
  { text: "Applying color correction & filters...", done: false },
  { text: "Preparing dynamic transitions...", done: false },
  { text: "Burning in typography & subtitle hooks...", done: false },
  { text: "Detecting speaking intervals for ducking...", done: false },
  { text: "Mixing background soundtrack & audio levels...", done: false },
  { text: "Rendering high-quality vertical MP4...", done: false },
  { text: "Running Quality Control checks...", done: false }
];

const Processing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState(initialLogs);
  
  const projectId = location.state?.projectId as string;
  const prompt = location.state?.prompt as string;
  const mood = location.state?.mood as string;
  const language = location.state?.language as string;
  const song = location.state?.song as Song;
  const customAudio = location.state?.customAudio as File;
  const storyboard = location.state?.storyboard as any[];

  useEffect(() => {
    if (!projectId || !storyboard) {
      navigate('/upload');
      return;
    }

    const intervalTime = 100;
    const duration = 12000; // ~12 seconds estimated progress bar pacing

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + (100 / (duration / intervalTime));
        if (next >= 98) return 98;
        return next;
      });
    }, intervalTime);

    const processVideos = async () => {
      try {
        // Trigger high-quality render from originals on the backend
        const response = await renderVideo(
          projectId, 
          storyboard, 
          song?.previewUrl, 
          customAudio, 
          false,
          song?.title,
          song?.artist
        );
        
        clearInterval(progressInterval);
        setProgress(100);
        setLogs(prev => prev.map(log => ({ ...log, done: true })));

        setTimeout(() => {
          navigate('/preview', { 
            state: { 
              projectId,
              videoUrl: response.videoUrl, 
              prompt, 
              mood, 
              language, 
              song, 
              caption: response.caption, 
              hook: response.hook,
              debug: response.debug // pass debug payload for drawer
            } 
          });
        }, 1000);
      } catch (error) {
        clearInterval(progressInterval);
        alert("Rendering failed! Please inspect logs in backend server console.");
        navigate('/upload');
      }
    };

    processVideos();

    return () => {
      clearInterval(progressInterval);
    };
  }, [projectId, storyboard, prompt, mood, language, navigate]);

  useEffect(() => {
    const idxToMark = Math.min(Math.floor(progress / 10), logs.length - 1);
    setLogs(prev => prev.map((log, i) => {
      if (i <= idxToMark) {
        return { ...log, done: true };
      }
      return log;
    }));
  }, [progress]);

  return (
    <div className="flex flex-col flex-1 p-2 sm:p-4 bg-background relative overflow-hidden justify-center min-h-[500px]">
      {/* Background blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent/5 blur-[110px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="w-full mb-8 flex items-center justify-center gap-2 text-gray-400 z-10">
        <Cpu className="w-4.5 h-4.5 text-primary animate-spin" />
        <span className="text-[10px] font-black tracking-widest uppercase">RaagaReel AI Neural Rendering Core</span>
      </div>

      {/* Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-4xl mx-auto w-full z-10">
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-[3px] border-t-transparent border-l-transparent border-r-primary border-b-primary opacity-60 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-4 rounded-full border-[3px] border-t-accent border-l-transparent border-r-transparent border-b-accent opacity-80 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]"
            />
            <motion.div
              animate={{ scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="w-24 h-24 rounded-full bg-[#0a0712] border border-white/10 flex items-center justify-center shadow-lg relative"
            >
              <Sparkles className="w-9 h-9 text-white fill-white animate-pulse" />
            </motion.div>
          </div>

          <div className="text-center space-y-1.5">
            <p className="text-xs font-black uppercase text-gray-500 tracking-wider">Estimated Pacing</p>
            <p className="text-xl font-black text-white">{Math.max(0, Math.ceil(12 - (progress / 100 * 12)))}s Remaining</p>
          </div>
        </div>

        {/* Console terminal logs */}
        <div className="lg:col-span-7 flex flex-col w-full">
          <div className="w-full bg-[#07050d] border border-white/5 rounded-3xl p-5 font-mono text-[10px] text-gray-400 h-64 overflow-y-auto no-scrollbar shadow-inner relative flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[9px] text-accent/80 font-black border-b border-white/5 pb-2.5 mb-2.5">
              <span>[AI COMPILATION UNIT console]</span>
              <span className="animate-pulse flex items-center gap-1">● RENDERING PIPELINE ACTIVE</span>
            </div>
            {logs.map((log, idx) => (
              <div key={idx} className={`flex items-start gap-2.5 leading-relaxed ${log.done ? 'text-gray-200' : 'text-gray-600'}`}>
                <span className={log.done ? 'text-emerald-400 font-bold' : 'text-gray-700'}>
                  {log.done ? "✓" : "❯"}
                </span>
                <span className={log.done ? 'font-semibold' : ''}>{log.text}</span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mt-6 w-full">
            <div className="flex justify-between text-[10px] font-black text-gray-500 mb-2 uppercase tracking-wider">
              <span>Progress Bar</span>
              <span className="text-accent">{Math.floor(progress)}% compiled</span>
            </div>
            <div className="w-full h-2.5 bg-black/45 rounded-full overflow-hidden border border-white/5 relative">
              <motion.div 
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Processing;

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Check, Loader2 } from 'lucide-react';
import { renderVideo } from '../services/api';

interface ProcessingState {
  projectId: string;
  files: File[];
  prompt: string;
  mood: string;
  language: string;
  song: any;
  customAudio: File | null;
  storyboard: any[];
}

export const Processing: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ProcessingState;

  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([
    { text: "Initializing AI Director Engine...", done: false },
    { text: "Reading project workspace state...", done: false },
    { text: "Syncing narrative story arc beats...", done: false },
    { text: "Applying color correction & filters...", done: false },
    { text: "Preparing dynamic transitions...", done: false },
    { text: "Burning in typography & subtitle hooks...", done: false },
    { text: "Detecting speaking intervals for ducking...", done: false },
    { text: "Mixing background soundtrack & audio levels...", done: false },
    { text: "Rendering high-quality vertical MP4...", done: false },
  ]);

  useEffect(() => {
    if (!state || !state.projectId) {
      navigate('/upload');
      return;
    }

    const { projectId, prompt, mood, language, song, customAudio, storyboard } = state;

    // Simulate progress log items
    const totalSteps = logs.length;
    const intervalTime = 1200; // ~10 seconds total progress animation

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (100 / totalSteps);
        if (next >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        
        // Mark current log as done
        const stepIdx = Math.floor((next / 100) * totalSteps);
        setLogs(logsPrev => logsPrev.map((log, i) => i <= stepIdx ? { ...log, done: true } : log));
        
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
          customAudio || undefined, 
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
      } catch (error: any) {
        clearInterval(progressInterval);
        const errMsg = error?.message || "Rendering failed! Please check backend service logs.";
        alert(`Rendering Issue: ${errMsg}`);
        navigate('/upload');
      }
    };

    processVideos();

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono uppercase tracking-wider mb-8">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          RaagaReel AI Processing Core
        </div>

        {/* Circular Progress Indicator */}
        <div className="relative w-44 h-44 mx-auto mb-10 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="88"
              cy="88"
              r="76"
              className="stroke-slate-800"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="88"
              cy="88"
              r="76"
              className="stroke-purple-500 transition-all duration-300 ease-out"
              strokeWidth="8"
              strokeDasharray={477}
              strokeDashoffset={477 - (477 * progress) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-4xl font-bold font-mono tracking-tight">{Math.round(progress)}%</span>
            <span className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Compiling Reel</span>
          </div>
        </div>

        {/* Progress Logs Panel */}
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-6 text-left mb-8 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              [AI COMPILATION UNIT console]
            </div>
            <div className="flex items-center gap-1.5 text-xs text-purple-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
              RENDERING PIPELINE ACTIVE
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {logs.map((log, index) => (
              <div key={index} className={`flex items-center justify-between transition-colors ${log.done ? 'text-slate-300' : 'text-slate-500'}`}>
                <span className="flex items-center gap-2">
                  {log.done ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin flex-shrink-0" />
                  )}
                  {log.text}
                </span>
                {log.done && <span className="text-[10px] text-emerald-500 font-semibold">OK</span>}
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-400 text-sm animate-pulse">
          Crafting your vertical cinematic reel with optimal rhythm and transitions...
        </p>
      </div>
    </div>
  );
};

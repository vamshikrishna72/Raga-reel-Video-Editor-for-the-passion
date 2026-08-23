import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Check, Loader2, AlertTriangle, XCircle } from 'lucide-react';
import { renderVideo, getJobStatus, cancelJob } from '../services/api';

interface ProcessingState {
  jobId?: string;
  projectId?: string;
  files?: File[];
  prompt?: string;
  mood?: string;
  language?: string;
  song?: any;
  customAudio?: File | null;
  storyboard?: any[];
}

export const Processing: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ProcessingState;

  const [progress, setProgress] = useState(5);
  const [currentStage, setCurrentStage] = useState('QUEUED');
  const [stageMessage, setStageMessage] = useState('Initializing AI Director Engine...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [logs, setLogs] = useState([
    { stage: 'QUEUED', text: 'Initializing AI Director Engine...', done: false },
    { stage: 'UPLOADING', text: 'Reading & storing source clips...', done: false },
    { stage: 'ANALYZING', text: 'Extracting video container & keyframe metadata...', done: false },
    { stage: 'UNDERSTANDING_PROMPT', text: 'Analyzing prompt storytelling intent...', done: false },
    { stage: 'BUILDING_STORY', text: 'Synthesizing narrative storyboard EDL...', done: false },
    { stage: 'SELECTING_MUSIC', text: 'Calculating track BPM & quarter-note beat sync...', done: false },
    { stage: 'EDITING', text: 'Applying color grading presets & transition graphs...', done: false },
    { stage: 'RENDERING', text: 'Encoding high-quality vertical MP4 via FFmpeg...', done: false },
    { stage: 'QUALITY_CHECK', text: 'Validating output streams & media integrity...', done: false },
  ]);

  useEffect(() => {
    if (!state) {
      navigate('/upload');
      return;
    }

    let pollInterval: NodeJS.Timeout;

    if (state.jobId) {
      // 1. Asynchronous Job Queue Polling Mode
      pollInterval = setInterval(async () => {
        try {
          const job = await getJobStatus(state.jobId!);
          if (!job) return;

          setProgress(job.progress || 10);
          setCurrentStage(job.currentStage || 'PROCESSING');
          if (job.stageMessage) setStageMessage(job.stageMessage);

          setLogs(prev => prev.map(log => {
            if (log.stage === job.currentStage) return { ...log, done: true };
            if (job.progress >= 95) return { ...log, done: true };
            return log;
          }));

          if (job.status === 'COMPLETED' && job.result) {
            clearInterval(pollInterval);
            setProgress(100);
            setTimeout(() => {
              navigate('/preview', {
                state: {
                  projectId: job.result.projectId,
                  videoUrl: job.result.videoUrl,
                  prompt: state.prompt || job.result.debug?.prompt,
                  mood: state.mood,
                  language: state.language,
                  song: state.song,
                  caption: job.result.caption,
                  hook: job.result.hook,
                  debug: job.result.debug
                }
              });
            }, 800);
          } else if (job.status === 'FAILED') {
            clearInterval(pollInterval);
            setErrorMessage(job.error || job.stageMessage || 'Video generation failed.');
          }
        } catch (e: any) {
          console.warn('Job poll error:', e.message);
        }
      }, 1500);

    } else if (state.projectId) {
      // 2. Direct Sync Render Mode Fallback
      const { projectId, prompt, mood, language, song, customAudio, storyboard } = state;
      const totalSteps = logs.length;

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + (100 / totalSteps);
          if (next >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          const stepIdx = Math.floor((next / 100) * totalSteps);
          setLogs(logsPrev => logsPrev.map((log, i) => i <= stepIdx ? { ...log, done: true } : log));
          return next;
        });
      }, 1200);

      renderVideo(
        projectId,
        storyboard || [],
        song?.previewUrl,
        customAudio || undefined,
        false,
        song?.title,
        song?.artist
      )
      .then(response => {
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
              debug: response.debug
            }
          });
        }, 1000);
      })
      .catch((error: any) => {
        clearInterval(progressInterval);
        setErrorMessage(error?.message || 'Rendering issue encountered.');
      });
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  const handleCancel = async () => {
    if (state?.jobId) {
      await cancelJob(state.jobId);
    }
    navigate('/upload');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono uppercase tracking-wider mb-8">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          RaagaReel AI Worker Execution Mode
        </div>

        {errorMessage ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-8 text-center space-y-4">
            <XCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h2 className="text-lg font-black uppercase text-white">Video Generation Failed</h2>
            <p className="text-xs text-red-300 font-semibold">{errorMessage}</p>
            <button 
              onClick={() => navigate('/upload')}
              className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              Return to Studio
            </button>
          </div>
        ) : (
          <>
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
                  strokeDashoffset={477 - (477 * Math.min(progress, 100)) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-bold font-mono tracking-tight">{Math.round(progress)}%</span>
                <span className="text-[10px] text-purple-400 mt-1 uppercase tracking-wider font-extrabold">{currentStage}</span>
              </div>
            </div>

            {/* Progress Logs Panel */}
            <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-6 text-left mb-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  [AI WORKER CONSOLE]
                </div>
                <div className="flex items-center gap-1.5 text-xs text-purple-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                  JOB ACTIVE
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

            <p className="text-slate-400 text-xs animate-pulse mb-6">
              {stageMessage}
            </p>

            <button 
              onClick={handleCancel}
              className="text-xs text-slate-500 hover:text-white uppercase font-bold tracking-wider cursor-pointer transition-colors"
            >
              Cancel Job
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Processing;

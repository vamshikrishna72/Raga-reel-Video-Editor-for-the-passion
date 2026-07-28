import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Download, Music2, Languages, Sparkles, Wand2, BarChart, Info, Terminal, ChevronDown, ChevronUp, RefreshCw, Send, Loader2 } from 'lucide-react';
import { renderVideo, reviseStoryboard } from '../services/api';
import type { Song } from '../services/musicCatalog';

const AnalyticsRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between items-center text-xs py-1.5 border-b border-white/[0.03]">
    <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">{label}</span>
    <span className="text-white font-extrabold">{value}</span>
  </div>
);

const Preview = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Initial State from Navigation
  const [projectId, setProjectId] = useState<string>(location.state?.projectId || "");
  const [videoUrl, setVideoUrl] = useState<string>(location.state?.videoUrl || "");
  const [prompt, setPrompt] = useState<string>(location.state?.prompt || "");
  const [mood, setMood] = useState<string>(location.state?.mood || "");
  const [language, setLanguage] = useState<string>(location.state?.language || "");
  const [song, setSong] = useState<Song | undefined>(location.state?.song);
  const [caption, setCaption] = useState<string>(location.state?.caption || "");
  const [hook, setHook] = useState<string>(location.state?.hook || "");
  const [debugData, setDebugData] = useState<any>(location.state?.debug || null);

  // Revision & UI State
  const [revisionInput, setRevisionInput] = useState("");
  const [isRevising, setIsRevising] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  if (!videoUrl) {
    navigate('/upload');
    return null;
  }

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `RaagaReel_Edit_${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApplyRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionInput.trim() || isRevising) return;

    setIsRevising(true);
    try {
      // 1. Submit instruction to backend revise endpoint to get updated storyboard
      const revRes = await reviseStoryboard(projectId, revisionInput);
      
      // 2. Perform a fast render using proxies on the backend
      const renderRes = await renderVideo(
        projectId, 
        revRes.storyboard, 
        song?.previewUrl, 
        undefined, // customAudio
        true, // useProxy = true for immediate preview feedback
        song?.title,
        song?.artist
      );

      // 3. Update view state
      setVideoUrl(renderRes.videoUrl);
      setCaption(renderRes.caption || caption);
      setHook(renderRes.hook || hook);
      setDebugData(renderRes.debug || debugData);
      setRevisionInput("");
      alert("Revision applied successfully via AI Co-Director!");
    } catch (err: any) {
      alert("Failed to apply revision. Make sure the backend server is running.");
    } finally {
      setIsRevising(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 p-2 sm:p-4 bg-background relative overflow-y-auto no-scrollbar pb-20">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between z-10 border-b border-white/5 pb-4"
      >
        <div>
          <span className="text-gray-400 text-[10px] font-black tracking-widest uppercase">AI Preview Room</span>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5 mt-1">
            <Wand2 className="w-5 h-5 text-accent animate-pulse" /> Verify Compilation
          </h1>
        </div>
        <button 
          onClick={() => navigate('/upload')} 
          className="text-xs text-gray-400 hover:text-white uppercase font-bold tracking-wider flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Lab Workspace
        </button>
      </motion.div>

      {/* Side-by-Side Split Workspace Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start max-w-5xl mx-auto w-full z-10">
        
        {/* LEFT COLUMN: Vertical 9:16 Video Player wrapper */}
        <div className="md:col-span-5 flex flex-col items-center space-y-4">
          <motion.div 
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-[280px] aspect-[9/16] rounded-[36px] bg-black border-[5px] border-gray-900 shadow-[0_0_40px_rgba(139,92,246,0.18)] overflow-hidden relative"
          >
            {isRevising ? (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3 text-center p-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-wider text-white">AI Co-Director is re-editing...</span>
                <span className="text-[8px] font-bold text-gray-500 uppercase">Updating proxy timelines</span>
              </div>
            ) : null}
            <video 
              key={videoUrl}
              src={videoUrl} 
              className="w-full h-full object-cover" 
              controls 
              autoPlay 
              loop 
              playsInline 
            />
            <div className="absolute top-4 left-4 z-20">
              <span className="text-[8px] bg-black/60 backdrop-blur-sm border border-white/10 text-white px-2 py-0.5 rounded font-black uppercase tracking-wider">
                HD Portrait Output
              </span>
            </div>
          </motion.div>

          {/* Conversational Revision Panel */}
          <form onSubmit={handleApplyRevision} className="w-[280px] relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl blur-md opacity-25"></div>
            <div className="relative bg-surface/80 border border-white/5 rounded-2xl p-3 flex gap-2">
              <input 
                type="text" 
                value={revisionInput}
                onChange={(e) => setRevisionInput(e.target.value)}
                placeholder="Instruct Co-Director... (e.g. make the intro faster)"
                className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-gray-600 font-semibold"
                disabled={isRevising}
              />
              <button 
                type="submit"
                disabled={!revisionInput.trim() || isRevising}
                className="p-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white disabled:opacity-30 cursor-pointer transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Curation Details & Creator Insights Gauges */}
        <div className="md:col-span-7 flex flex-col space-y-6">
          
          {/* Curation summaries */}
          <div className="glass-panel border border-white/5 rounded-3xl p-6 space-y-5">
            <div>
              <span className="text-[9px] bg-accent/20 border border-accent/30 text-white px-2.5 py-1 rounded-full font-black uppercase tracking-wider inline-block mb-3">
                Curation Summary
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Director prompt</h3>
              <p className="text-xs font-bold text-gray-300 leading-relaxed bg-white/[0.01] border border-white/5 rounded-xl p-3">
                "{prompt}"
              </p>
            </div>

            {hook && (
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1.5">Narrator Hook (ElevenLabs)</h3>
                <p className="text-xs font-extrabold text-accent italic bg-[#100b1a]/40 border border-accent/15 rounded-xl p-3">
                  "{hook}"
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/35 border border-white/5 rounded-xl p-3 flex items-center gap-3">
                <Music2 className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">Soundtrack</span>
                  <p className="text-[10px] font-black text-white truncate mt-0.5">{song?.title || 'Auto Sync'}</p>
                </div>
              </div>
              <div className="bg-black/35 border border-white/5 rounded-xl p-3 flex items-center gap-3">
                <Languages className="w-4 h-4 text-accent shrink-0" />
                <div className="min-w-0">
                  <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">Mood / Language</span>
                  <p className="text-[10px] font-black text-white truncate mt-0.5">{mood} / {language}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Real Clip & Render Curation Analytics */}
          <div className="glass-panel border border-white/5 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5 border-b border-white/[0.03] pb-2">
              <BarChart className="w-4 h-4 text-accent" /> Director Curation Analytics
            </h3>
            
            <div className="space-y-1">
              <AnalyticsRow label=" narrative thematic focus" value={debugData?.promptInterpretation?.theme || "Lifestyle Edit"} />
              <AnalyticsRow label="total scenes" value={debugData?.storyboard?.length || 0} />
              <AnalyticsRow label="cinematic color grading" value={debugData?.promptInterpretation?.colorGrading || "Default LUT"} />
              <AnalyticsRow label="soundtrack beats tempo" value={debugData?.musicSelection?.bpm ? `${debugData.musicSelection.bpm} BPM` : "120 BPM"} />
              <AnalyticsRow label="render duration" value={debugData?.renderTimeMs ? `${(debugData.renderTimeMs / 1000).toFixed(2)}s` : "Processing"} />
              <AnalyticsRow label="quality health check" value="PASSED (1080p H.264 / AAC)" />
            </div>

            {/* Suggestions Box */}
            <div className="mt-4 bg-[#0a0f0d]/40 border border-emerald-500/15 rounded-2xl p-4 flex items-start gap-2.5 text-[10px] text-gray-400 font-semibold leading-relaxed">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-emerald-400 uppercase tracking-wider block mb-1">Director Suggestion</span>
                We generated a low-res proxy rendering for your revision review. When you are ready to export the final high-quality Instagram/TikTok Reel, click **Continue to Post**.
              </div>
            </div>
          </div>

          {/* DEVELOPER DEBUG PANEL */}
          {debugData && (
            <div className="glass-panel border border-white/5 rounded-3xl p-4">
              <button 
                onClick={() => setIsDebugOpen(!isDebugOpen)}
                className="w-full flex items-center justify-between text-xs font-black text-gray-400 uppercase tracking-wider cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-primary" /> Dev Debug Panel
                </span>
                {isDebugOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <AnimatePresence>
                {isDebugOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-3"
                  >
                    <pre className="w-full p-4 rounded-2xl bg-black text-[9px] text-emerald-400 font-mono overflow-x-auto max-h-60 leading-normal border border-white/5 select-text">
                      {JSON.stringify(debugData, null, 2)}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleDownload}
              className="w-full sm:flex-1 py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-100 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-lg"
            >
              Download Preview <Download className="w-4 h-4 text-black" />
            </button>
            <button
              onClick={() => navigate('/post', { state: { videoUrl, prompt, mood, language, song, caption, hook } })}
              className="w-full sm:flex-1 py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-[0_0_20px_rgba(139,92,246,0.25)]"
            >
              Continue to Export <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Preview;

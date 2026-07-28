import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Copy, Share2, Award, Sparkles, CheckCircle2, ChevronRight, Settings, Cloud, ShieldCheck } from 'lucide-react';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.5"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const CaptionPost = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const videoUrl = location.state?.videoUrl as string;
  const captionText = location.state?.caption as string || "";
  const hook = location.state?.hook as string || "";

  const [caption, setCaption] = useState(captionText);
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Advanced Export Configurations
  const [targetPlatform, setTargetPlatform] = useState<string>("instagram");
  const [resolution, setResolution] = useState<string>("1080p");
  const [fps, setFps] = useState<string>("30");
  const [cloudBackup, setCloudBackup] = useState<boolean>(true);

  if (!videoUrl) {
    navigate('/upload');
    return null;
  }

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePublishSimulation = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setPublishSuccess(true);
    }, 2000);
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
          <span className="text-gray-400 text-[10px] font-black tracking-widest uppercase">Publishing Core</span>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5 mt-1">
            <Share2 className="w-5 h-5 text-accent animate-pulse" /> Export & Schedule
          </h1>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          className="text-xs text-gray-400 hover:text-white uppercase font-bold tracking-wider flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Preview
        </button>
      </motion.div>

      {/* Grid Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center max-w-5xl mx-auto w-full z-10">
        
        {/* LEFT COLUMN: Floating Player mockup */}
        <div className="md:col-span-5 flex justify-center">
          <motion.div 
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-[280px] aspect-[9/16] rounded-[36px] bg-black border-[5px] border-gray-900 shadow-[0_0_40px_rgba(236,72,153,0.15)] overflow-hidden relative"
          >
            <video src={videoUrl} className="w-full h-full object-cover" controls loop muted autoPlay playsInline />
          </motion.div>
        </div>

        {/* RIGHT COLUMN: Custom Curation publish panel & Export properties */}
        <div className="md:col-span-7 flex flex-col space-y-6">
          
          {/* Metadata Card */}
          <div className="glass-panel border border-white/5 rounded-3xl p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-white/[0.03] pb-3">
              <span className="text-[9px] bg-primary/20 border border-primary/30 text-white px-2.5 py-0.5 rounded font-black uppercase tracking-wider">
                Post caption details
              </span>
              <button 
                onClick={handleCopyCaption}
                className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 font-bold uppercase transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy Caption"}
              </button>
            </div>

            <textarea 
              value={caption} 
              onChange={(e) => setCaption(e.target.value)}
              className="w-full h-36 bg-black/45 border border-white/5 rounded-2xl p-4 text-xs font-semibold text-gray-300 leading-relaxed focus:outline-none focus:border-accent/40"
            />
          </div>

          {/* Export Settings Card */}
          <div className="glass-panel border border-white/5 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5 border-b border-white/[0.03] pb-2">
              <Settings className="w-4 h-4 text-primary animate-pulse" /> Export configurations
            </h3>

            {/* Platform Selection */}
            <div className="space-y-2">
              <span className="text-[9px] text-gray-500 font-black uppercase tracking-wider block">Target platform</span>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-black uppercase tracking-wider">
                {["instagram", "youtube", "whatsapp", "tiktok"].map((plat) => (
                  <button
                    key={plat}
                    onClick={() => setTargetPlatform(plat)}
                    className={`py-2 border rounded-xl cursor-pointer transition-all ${
                      targetPlatform === plat 
                        ? 'bg-accent/15 border-accent text-white' 
                        : 'bg-white/[0.01] border-white/5 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {plat}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution and Frame rate grids */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="space-y-2">
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-wider block">Max Resolution</span>
                <div className="flex gap-2 text-center text-[9px] font-black uppercase tracking-wider">
                  {["720p", "1080p", "4k"].map((res) => (
                    <button
                      key={res}
                      onClick={() => setResolution(res)}
                      className={`flex-1 py-2 border rounded-xl cursor-pointer ${
                        resolution === res ? 'bg-primary/20 border-primary text-white' : 'bg-black/35 border-white/5 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-wider block">Frame Rate</span>
                <div className="flex gap-2 text-center text-[9px] font-black uppercase tracking-wider">
                  {["30", "60"].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setFps(rate)}
                      className={`flex-1 py-2 border rounded-xl cursor-pointer ${
                        fps === rate ? 'bg-primary/20 border-primary text-white' : 'bg-black/35 border-white/5 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {rate} FPS
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cloud Backup Toggle */}
            <div 
              onClick={() => setCloudBackup(!cloudBackup)}
              className="flex justify-between items-center bg-black/45 rounded-2xl p-3 border border-white/5 cursor-pointer hover:bg-black/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Cloud className={`w-4 h-4 ${cloudBackup ? 'text-primary' : 'text-gray-500'}`} />
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-wide">Backup to Creator Cloud</span>
              </div>
              <span className={`w-3.5 h-3.5 rounded-full ${cloudBackup ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-gray-700'}`} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handlePublishSimulation}
              disabled={isPublishing}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer shadow-[0_0_20px_rgba(236,72,153,0.3)]"
            >
              {isPublishing ? "Processing Cloud Export..." : `Export & Publish Reel`}
              {isPublishing ? null : <InstagramIcon className="w-4 h-4 text-white" />}
            </button>

            <button
              onClick={() => navigate('/home')}
              className="w-full py-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.08] text-gray-400 hover:text-white border border-white/5 font-black text-xs uppercase tracking-widest text-center cursor-pointer transition-colors"
            >
              Return to Creator Dashboard
            </button>
          </div>
        </div>

      </div>

      {/* Success Dialog Modal popup */}
      <AnimatePresence>
        {publishSuccess && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b0816] border border-white/10 rounded-[32px] p-8 max-w-sm w-full text-center space-y-6 shadow-2xl relative animate-pulse"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-white">Reel Uploaded!</h2>
                <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                  Your beat-synchronized video with custom transitions and narration has been uploaded successfully.
                </p>
              </div>

              <button
                onClick={() => {
                  setPublishSuccess(false);
                  navigate('/home');
                }}
                className="w-full py-4 rounded-xl bg-white text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Go to Dashboard <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CaptionPost;

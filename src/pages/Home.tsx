import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Sparkles, TrendingUp, Clock, Zap, Flame, Award, BarChart, Cloud, Calendar, Star, Compass, Music, CheckCircle2 } from 'lucide-react';
import { getTrends } from '../services/api';

const PerformanceChart = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high resolution for canvas
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const points = [15, 30, 25, 45, 35, 60, 50, 75];
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Today"];

    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = 20 + (i * (height - 40)) / 4;
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(width - 20, y);
      ctx.stroke();
    }

    // Draw Gradient Area under the curve
    const areaGrd = ctx.createLinearGradient(0, 0, 0, height);
    areaGrd.addColorStop(0, "rgba(139,92,246,0.15)");
    areaGrd.addColorStop(1, "rgba(139,92,246,0.0)");

    ctx.beginPath();
    ctx.moveTo(30, height - 20);

    const xStep = (width - 50) / (points.length - 1);
    points.forEach((p, idx) => {
      const x = 30 + idx * xStep;
      const y = height - 20 - (p / 80) * (height - 40);
      ctx.lineTo(x, y);
    });
    ctx.lineTo(30 + (points.length - 1) * xStep, height - 20);
    ctx.closePath();
    ctx.fillStyle = areaGrd;
    ctx.fill();

    // Draw Gradient Line
    const lineGrd = ctx.createLinearGradient(0, 0, width, 0);
    lineGrd.addColorStop(0, "#8b5cf6");
    lineGrd.addColorStop(0.5, "#ec4899");
    lineGrd.addColorStop(1, "#3b82f6");

    ctx.strokeStyle = lineGrd;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    points.forEach((p, idx) => {
      const x = 30 + idx * xStep;
      const y = height - 20 - (p / 80) * (height - 40);
      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw Points
    points.forEach((p, idx) => {
      const x = 30 + idx * xStep;
      const y = height - 20 - (p / 80) * (height - 40);

      // Dot fill
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = idx === points.length - 1 ? "#ec4899" : "#8b5cf6";
      ctx.fill();

      // Dot border overlay
      ctx.beginPath();
      ctx.arc(x, y, 6.5, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Draw Labels
    ctx.fillStyle = "#6b7280";
    ctx.font = "bold 8px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    labels.forEach((l, idx) => {
      const x = 30 + idx * xStep;
      ctx.fillText(l, x, height - 5);
    });

  }, []);

  return <canvas ref={canvasRef} className="w-full h-44" />;
};

const Home = () => {
  const navigate = useNavigate();
  const [profileImg, setProfileImg] = useState(localStorage.getItem('profileImg') || "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/04d041b1-c75c-4021-9d7d-222ebd9d5089/id-preview-6c1a964a--c53eea9c-028f-460c-816b-f8eacba6d4cd.lovable.app-1773559170300.png");
  const [trends, setTrends] = useState<{ type: string; name: string; score: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getTrends().then((data: any) => {
      if (data && data.trends) {
        setTrends(data.trends);
      }
    });
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileImg(event.target.result as string);
          localStorage.setItem('profileImg', event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const recentExports = [
    { id: 1, title: "Summer_Vlog_01.mp4", size: "12.4 MB", views: "4.8K", duration: "12s" },
    { id: 2, title: "Gym_BeastMode.mp4", size: "8.1 MB", views: "12.9K", duration: "10s" },
    { id: 3, title: "Wedding_Teaser.mp4", size: "14.2 MB", views: "3.2K", duration: "15s" },
    { id: 4, title: "Apple_Unboxing.mp4", size: "6.7 MB", views: "8.4K", duration: "8s" }
  ];

  const scheduledPosts = [
    { platform: "Instagram", time: "6:00 PM Today", title: "Gym Motivation Edit" },
    { platform: "YouTube Shorts", time: "10:30 AM Tomorrow", title: "Cinematic Travel Recap" }
  ];

  return (
    <div className="relative flex-1 flex flex-col bg-background p-2 sm:p-4 overflow-y-auto no-scrollbar pb-24">
      {/* Header Row */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex justify-between items-center z-10 border-b border-white/5 pb-5"
      >
        <div>
          <span className="text-gray-400 text-[10px] font-black tracking-widest uppercase">Creator Workspace Studio</span>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2 mt-1">
            Welcome Back, Director <span className="animate-bounce">👋</span>
          </h1>
        </div>
        
        {/* Profile Avatar Trigger */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary via-accent to-secondary p-[2px] cursor-pointer hover:scale-105 transition-transform relative group shadow-lg"
        >
          <div className="w-full h-full rounded-full bg-surface overflow-hidden relative">
            <img src={profileImg} alt="Profile" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-bold text-white transition-opacity">
              Edit
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleProfileChange} hidden accept="image/*" />
        </div>
      </motion.div>

      {/* Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* LEFT COLUMN: Metric analytics & chart lines */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 animate-pulse">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-black">Retention Score</p>
                <p className="text-md font-black text-white mt-0.5">86% Peak</p>
              </div>
            </div>
            
            <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-black">Creator Analytics</p>
                <p className="text-md font-black text-white mt-0.5">14.8K Watch Hrs</p>
              </div>
            </div>

            {/* Cloud Storage Capacity gauge */}
            <div className="glass-panel rounded-2xl p-4 flex flex-col justify-center border border-white/5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-accent" /> Cloud Storage
                </span>
                <span className="text-[10px] text-gray-300 font-extrabold">3.2 GB / 50 GB</span>
              </div>
              <div className="w-full h-1.5 bg-black/45 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: '6.4%' }} />
              </div>
            </div>
          </div>

          {/* HTML5 Canvas Line Chart Panel */}
          <div className="glass-panel border border-white/5 rounded-3xl p-5">
            <div className="flex justify-between items-center mb-4 border-b border-white/[0.04] pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Audience Growth</h3>
                <h2 className="text-md font-extrabold text-white mt-0.5">Views Trend Performance</h2>
              </div>
              <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                +14.2% Views
              </span>
            </div>
            <PerformanceChart />
          </div>

        </div>

        {/* RIGHT COLUMN: Suggestions & Schedule Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Scheduling Calendars */}
          <div className="glass-panel border border-white/5 rounded-3xl p-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-4">
              <Calendar className="w-4 h-4 text-accent" /> Scheduled Queue
            </h3>
            <div className="space-y-3">
              {scheduledPosts.map((post, index) => (
                <div key={index} className="bg-black/35 rounded-2xl p-3 border border-white/5 flex flex-col gap-1 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-gray-500 uppercase">{post.platform}</span>
                    <span className="text-primary font-black uppercase tracking-tight text-[9px]">{post.time}</span>
                  </div>
                  <h4 className="font-extrabold text-white">{post.title}</h4>
                </div>
              ))}
            </div>
          </div>

          {/* Curation Favorites / Quick prompts templates */}
          <div className="glass-panel border border-white/5 rounded-3xl p-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-4">
              <Star className="w-4 h-4 text-neon-gold" /> Favorite Prompt Presets
            </h3>
            <div className="space-y-2 text-[10px]">
              <div 
                onClick={() => navigate('/upload')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/30 hover:bg-white/[0.05] transition-all cursor-pointer font-bold"
              >
                <span>Luxury Cinematic Vlog</span>
                <Compass className="w-3.5 h-3.5 text-primary" />
              </div>
              <div 
                onClick={() => navigate('/upload')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-accent/30 hover:bg-white/[0.05] transition-all cursor-pointer font-bold"
              >
                <span>Fast Beat Gym Motivation</span>
                <Flame className="w-3.5 h-3.5 text-accent fill-accent" />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Primary Studio Action Trigger Banner */}
      <div className="relative glass-panel rounded-[32px] p-6 border border-white/5 overflow-hidden mb-8 shadow-lg">
        {/* Glow */}
        <div className="absolute right-[-10%] top-[-25%] w-64 h-64 bg-accent/10 rounded-full blur-[50px] pointer-events-none" />
        <div className="relative z-10 max-w-xl space-y-3.5">
          <span className="text-[9px] bg-primary/20 border border-primary/30 text-white px-2.5 py-1 rounded-full font-black uppercase tracking-wider inline-block">
            RaagaReel Co-Director
          </span>
          <h2 className="text-2xl font-black text-white leading-tight">Create your next viral masterpiece with AI Creative Direction</h2>
          <p className="text-xs text-gray-400 leading-relaxed font-semibold">Describe your vision. Analyze raw clips. Review visual storyboards. Duck audio. Render immediately.</p>
          <button
            onClick={() => navigate('/upload')}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary via-accent to-secondary text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg"
          >
            <Sparkles className="w-4 h-4 fill-white" /> Direct AI Reel
          </button>
        </div>
      </div>

      {/* Recent Works Grid */}
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-5 z-10">
          <h3 className="text-md font-extrabold tracking-tight text-white flex items-center gap-1.5 uppercase">
            <Award className="w-4.5 h-4.5 text-primary animate-pulse" /> Recent AI Curation Exports
          </h3>
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Historical Exports</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {recentExports.map((item, index) => (
            <div
              key={item.id}
              onClick={() => navigate('/upload')}
              className="flex flex-col gap-2 cursor-pointer group"
            >
              <div className="w-full aspect-[9/16] rounded-3xl bg-[#0a0712] border border-white/5 relative overflow-hidden shadow-md">
                <img 
                  src={`https://picsum.photos/seed/reel-${item.id}/300/500`} 
                  alt="Thumbnail" 
                  className="w-full h-full object-cover opacity-45 group-hover:opacity-75 group-hover:scale-105 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 fill-black ml-0.5" />
                  </div>
                </div>

                {/* Overlays */}
                <div className="absolute top-3 right-3 text-[7px] bg-black/60 backdrop-blur-sm border border-white/10 text-white px-2 py-0.5 rounded font-black uppercase">
                  {item.duration}
                </div>

                <div className="absolute bottom-3 left-3 flex items-center gap-1">
                  <span className="text-[8px] bg-primary/20 border border-primary/30 text-white px-2 py-0.5 rounded font-black uppercase">
                    {item.views} views
                  </span>
                </div>
              </div>
              
              <div className="px-1.5 space-y-0.5">
                <p className="text-[11px] font-black text-gray-300 truncate">{item.title}</p>
                <p className="text-[9px] text-gray-500 font-bold uppercase">{item.size}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileVideo, X, Sparkles, Clapperboard, Wand2, Music2, Search, Play, Pause, Check, Loader2, ChevronRight, MessageSquare, ListTodo, Layers, AlertCircle } from 'lucide-react';
import { musicCatalog, type Song } from '../services/musicCatalog';
import { analyzeClips, createJob, pingBackend } from '../services/api';

const Equalizer = () => (
  <div className="flex items-end gap-[2px] h-3.5 w-3.5 shrink-0">
    {[1, 2, 3].map((bar) => (
      <motion.div
        key={bar}
        animate={{ height: ["20%", "100%", "20%"] }}
        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: bar * 0.15 }}
        className="w-[3px] bg-primary rounded-full"
      />
    ))}
  </div>
);

interface StoryboardScene {
  sceneTitle: string;
  clipIndex: number;
  startTime: number;
  duration: number;
  rationale: string;
  transition: string;
}

const Upload = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Core State
  const [files, setFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  
  // Smart Diagnostics Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [clipsMetadata, setClipsMetadata] = useState<any[]>([]);
  
  // AI Co-Director Chat State
  const [chatStep, setChatStep] = useState<number>(0); // 0: Idle, 1: Focus Selection, 2: Style Selection, 3: Analyzing, 4: Completed
  const [directorChat, setDirectorChat] = useState<{ sender: 'director' | 'user'; text: string; options?: string[] }[]>([]);
  const [curationChoices, setCurationChoices] = useState({ focus: '', style: '' });

  // Storyboard State
  const [storyboard, setStoryboard] = useState<StoryboardScene[]>([]);
  const [colorGrading, setColorGrading] = useState<string>("default");
  
  // Music State
  const [selectedSong, setSelectedSong] = useState<Song>(musicCatalog[0]);
  const [customAudioFile, setCustomAudioFile] = useState<File | null>(null);
  const customAudioInputRef = useRef<HTMLInputElement>(null);
  const [showMusicDrawer, setShowMusicDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [langFilter, setLangFilter] = useState("All");
  const [moodFilter, setMoodFilter] = useState("All");
  const [isPlayingSongId, setIsPlayingSongId] = useState<string | null>(null);
  const [loadingSongId, setLoadingSongId] = useState<string | null>(null);
  
  // Music Selection Tabs
  const [musicTab, setMusicTab] = useState<'foryou' | 'browse' | 'saved'>('foryou');
  const [savedSongIds, setSavedSongIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('savedSongIds');
    return saved ? JSON.parse(saved) : [];
  });

  const suggestions = [
    "Make it cinematic 🎬",
    "Create a luxury travel vlog 💎",
    "Edit like an Apple commercial ⚡",
    "Create a gym motivation reel 🔥",
    "Turn this into a movie trailer 🎥"
  ];

  const transitionPacks = [
    { id: "hollywood", label: "Hollywood Pack", desc: "Cinematic Fades & Ramps", transition: "fade" },
    { id: "luxury", label: "Luxury Pack", desc: "Focus Blurs & Zoom bounce", transition: "blur" },
    { id: "viral", label: "Instagram Viral", desc: "Fast cuts & Flash exposures", transition: "flash" },
    { id: "minimal", label: "Minimalist Style", desc: "Clean hard cuts", transition: "cuts" }
  ];

  const languages = ["All", "Telugu", "Hindi", "English", "Tamil", "Punjabi", "Malayalam", "Kannada"];
  const moods = ["All", "Hype", "Chill", "Cinematic", "Emotional", "Romantic", "Travel", "Motivation"];

  useEffect(() => {
    pingBackend();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const addedFiles = Array.from(e.target.files);
      setFiles(prev => {
        const next = [...prev, ...addedFiles];
        // Trigger Co-Director Chat initialization
        setChatStep(1);
        setDirectorChat([
          { 
            sender: 'director', 
            text: `Welcome to Creator Studio! I see you uploaded ${next.length} clips. Let's design the visual plan. What should be the primary storytelling narrative focus?`,
            options: ["Memories & Mood", "High Motion & Action", "Balanced Scenery"]
          }
        ]);
        return next;
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    const nextFiles = files.filter((_, i) => i !== index);
    setFiles(nextFiles);
    if (nextFiles.length === 0) {
      setStoryboard([]);
      setProjectId(null);
      setClipsMetadata([]);
      setChatStep(0);
      setDirectorChat([]);
    } else {
      setChatStep(1);
      setDirectorChat([
        { 
          sender: 'director', 
          text: `Welcome to Creator Studio! I see you uploaded ${nextFiles.length} clips. Let's design the visual plan. What should be the primary storytelling narrative focus?`,
          options: ["Memories & Mood", "High Motion & Action", "Balanced Scenery"]
        }
      ]);
    }
  };

  // Run backend multimodal analyzer
  const runBackendAnalysis = async (focus: string, style: string) => {
    setIsScanning(true);
    setScanError(null);
    setChatStep(3);
    setDirectorChat(prev => [
      ...prev,
      { sender: 'director', text: "Analyzing your footage container properties, keyframe content, and scene alignment. Please wait..." }
    ]);

    try {
      const finalPrompt = prompt || `Create an edit focused on ${focus} in ${style} style.`;
      const res = await analyzeClips(files, finalPrompt, moodFilter !== "All" ? moodFilter : undefined, langFilter !== "All" ? langFilter : undefined);
      
      setProjectId(res.projectId);
      setStoryboard(res.storyboard);
      setClipsMetadata(res.clipsMetadata);
      setColorGrading(res.colorGrading || "default");

      // Auto-recommend a matching song from our catalog
      if (res.musicRecommendation) {
        const recMood = res.musicRecommendation.mood;
        const matchingSong = musicCatalog.find(s => s.mood.toLowerCase() === recMood.toLowerCase());
        if (matchingSong) {
          setSelectedSong(matchingSong);
        }
      }

      setDirectorChat(prev => [
        ...prev,
        { 
          sender: 'director', 
          text: `Analysis complete! I sequenced a narrative story structure below with dynamic ${res.colorGrading} color grading. You can review the scene sequence, reorder clips, or adjust audio before exporting.` 
        }
      ]);
      setChatStep(4);
    } catch (err: any) {
      setScanError(err.message || "Failed to analyze video files.");
      setChatStep(1);
    } finally {
      setIsScanning(false);
    }
  };

  // Chat choice triggers
  const handleChatChoice = (option: string) => {
    if (chatStep === 1) {
      setCurationChoices(prev => ({ ...prev, focus: option }));
      setDirectorChat(prev => [
        ...prev,
        { sender: 'user', text: option },
        { 
          sender: 'director', 
          text: `Got it. Directing with focus on "${option}". Next, which editorial cinematic style matches your vision?`,
          options: ["Hollywood Cinematic", "Netflix Documentary", "Apple Commercial Preset", "Vibe Vlog Edit"]
        }
      ]);
      setChatStep(2);
    } else if (chatStep === 2) {
      setCurationChoices(prev => ({ ...prev, style: option }));
      setDirectorChat(prev => [
        ...prev,
        { sender: 'user', text: option }
      ]);
      runBackendAnalysis(curationChoices.focus, option);
    }
  };

  const moveScene = (index: number, direction: 'up' | 'down') => {
    const nextStoryboard = [...storyboard];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= storyboard.length) return;
    
    const temp = nextStoryboard[index];
    nextStoryboard[index] = nextStoryboard[targetIdx];
    nextStoryboard[targetIdx] = temp;
    setStoryboard(nextStoryboard);
  };

  const handlePlayPreview = async (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isPlayingSongId === song.id) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingSongId(null);
      return;
    }

    if (audioRef.current) audioRef.current.pause();

    let url = song.previewUrl;
    if (!url) {
      setLoadingSongId(song.id);
      try {
        const term = `${song.title} ${song.artist}`;
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=1`);
        const data = await res.json();
        if (data.results && data.results[0]?.previewUrl) {
          url = data.results[0].previewUrl;
          song.previewUrl = url;
        }
      } catch (err) {
        console.warn("iTunes search failed, fallback used:", err);
      } finally {
        setLoadingSongId(null);
      }
    }

    if (!url) {
      url = `http://localhost:3001/music/${song.language.toLowerCase()}_${song.mood.toLowerCase()}.wav`;
    }

    const audio = new Audio(url);
    audio.loop = true;
    audio.play().catch(err => console.warn(err));
    
    audioRef.current = audio;
    setIsPlayingSongId(song.id);
  };

  const handleToggleSave = (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedSongIds(prev => {
      const next = prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId];
      localStorage.setItem('savedSongIds', JSON.stringify(next));
      return next;
    });
  };

  const handleCustomAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCustomAudioFile(file);
      setSelectedSong({
        id: 'custom-audio',
        title: file.name,
        artist: 'User Uploaded BGM',
        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150',
        previewUrl: URL.createObjectURL(file),
        mood: 'Custom',
        language: 'Custom',
        isTrending: false
      });
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingSongId(null);
    }
  };

  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    if (song.id !== 'custom-audio') setCustomAudioFile(null);
    setShowMusicDrawer(false);
  };

  const handleProcess = () => {
    if (!projectId || storyboard.length === 0) return;
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingSongId(null);
    }

    navigate('/processing', { 
      state: { 
        projectId,
        files, 
        prompt: prompt || `Edited with focus on ${curationChoices.focus} in ${curationChoices.style} style.`,
        mood: selectedSong.mood,
        language: selectedSong.language,
        song: selectedSong,
        customAudio: customAudioFile,
        storyboard
      } 
    });
  };

  const displayedSongs = (() => {
    let list = musicCatalog;
    if (musicTab === 'foryou') {
      list = musicCatalog.filter(s => s.isTrending || s.language === 'Telugu' || s.language === 'English');
    } else if (musicTab === 'saved') {
      list = musicCatalog.filter(s => savedSongIds.includes(s.id));
    }

    if (searchQuery) {
      list = list.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.artist.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (musicTab === 'browse') {
      if (langFilter !== "All") list = list.filter(s => s.language === langFilter);
      if (moodFilter !== "All") list = list.filter(s => s.mood === moodFilter);
    }
    return list;
  })();

  return (
    <div className="flex flex-col flex-1 bg-background p-2 sm:p-4 overflow-y-auto no-scrollbar pb-20 relative">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between z-10 border-b border-white/5 pb-4"
      >
        <div>
          <span className="text-gray-400 text-[10px] font-black tracking-widest uppercase">AI Co-Director Studio</span>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5 mt-1">
            <Clapperboard className="w-5 h-5 text-primary" /> AI Director Lab
          </h1>
        </div>
        <button onClick={() => navigate('/home')} className="text-xs text-gray-400 hover:text-white uppercase font-bold tracking-wider">
          Cancel
        </button>
      </motion.div>

      {/* Hidden inputs */}
      <input type="file" multiple accept="video/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      <input type="file" accept="audio/*" className="hidden" ref={customAudioInputRef} onChange={handleCustomAudioChange} />

      {/* Workspace Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* LEFT COLUMN: Prompt Input, Curation chat */}
        <div className="lg:col-span-6 flex flex-col space-y-6">
          
          {/* Describe Your Vision Card */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-3xl blur-md opacity-20"></div>
            <div className="relative bg-surface/50 border border-white/5 rounded-3xl p-5 flex flex-col">
              <label className="text-[10px] text-accent font-black tracking-widest uppercase mb-3.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-accent text-accent" /> Describe Your Storytelling Vision
              </label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your editing vision... (e.g. Cinematic travel vlog with heavy zoom ramp transitions, or Fast workout edit with flash beat synchronization)"
                className="w-full bg-transparent text-white resize-none h-24 focus:outline-none placeholder:text-gray-600 text-sm font-semibold leading-relaxed"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(suggestion.replace(/ [🎬💎⚡🔥🎥]/, ''))}
                    className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[9px] font-bold text-gray-400 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Co-Director Chat Dialog Panel */}
          {files.length > 0 && (
            <div className="glass-panel border border-white/5 rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/[0.04] pb-2 text-xs font-black uppercase tracking-wider text-accent">
                <MessageSquare className="w-4 h-4 text-accent" /> Co-Director Chat Interview
              </div>

              <div className="space-y-3.5 max-h-56 overflow-y-auto no-scrollbar">
                {directorChat.map((msg, index) => (
                  <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs font-semibold leading-relaxed ${
                       msg.sender === 'user'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-white/[0.03] border border-white/5 text-gray-300 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Option Triggers */}
              {chatStep > 0 && chatStep < 3 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.04]">
                  {directorChat[directorChat.length - 1]?.options?.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChatChoice(opt)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary/25 to-accent/25 border border-primary/30 text-white font-black uppercase text-[9px] tracking-wider hover:scale-102 active:scale-98 transition-all cursor-pointer"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {scanError && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 flex items-center gap-3 text-red-400 text-xs font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{scanError}</span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Storyboard & Curation */}
        <div className="lg:col-span-6 flex flex-col space-y-6">
          
          {/* BGM Soundtrack select card */}
          <div className="glass-panel border border-white/5 rounded-3xl p-5">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Music2 className="w-4 h-4 text-accent" /> Soundtrack Sync
              </h3>
              <button onClick={() => setShowMusicDrawer(true)} className="text-xs text-primary font-black hover:underline cursor-pointer">
                Change Music
              </button>
            </div>
            
            <div className="bg-black/35 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent overflow-hidden shrink-0 relative group">
                  <img src={selectedSong.thumbnail} alt="cover" className="w-full h-full object-cover" />
                  <div 
                    onClick={(e) => handlePlayPreview(selectedSong, e)}
                    className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-100 cursor-pointer"
                  >
                    {loadingSongId === selectedSong.id ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : isPlayingSongId === selectedSong.id ? (
                      <Pause className="w-5 h-5 text-white fill-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-xs text-white truncate">{selectedSong.title}</h4>
                    {isPlayingSongId === selectedSong.id && <Equalizer />}
                  </div>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5 font-semibold">{selectedSong.artist}</p>
                </div>
              </div>
              <span className="text-[9px] bg-primary/20 border border-primary/30 text-white px-2.5 py-0.5 rounded-full font-bold uppercase shrink-0">
                {selectedSong.mood}
              </span>
            </div>
          </div>

          {/* Upload Drop Zone Trigger */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 border border-dashed border-primary/30 hover:border-primary/60 rounded-3xl bg-surface/30 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-primary/[0.01] transition-all duration-300"
          >
            {isScanning ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8 text-primary" />
            )}
            <div className="text-center space-y-1">
              <p className="font-black text-white text-xs uppercase tracking-wider">
                {isScanning ? "AI Analyzing footage..." : "Upload raw video footage"}
              </p>
              <p className="text-[9px] text-gray-500 font-bold uppercase">
                {isScanning ? "Probing metadata & segments" : "Click to select video clips"}
              </p>
            </div>
          </div>

          {/* Temporary Mock Button for Browser Automation */}
          <button
            id="mock-upload-btn"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const r1 = await fetch('/sample1.mp4');
                const b1 = await r1.blob();
                const f1 = new File([b1], 'sample1.mp4', { type: 'video/mp4' });
                const r2 = await fetch('/sample2.mp4');
                const b2 = await r2.blob();
                const f2 = new File([b2], 'sample2.mp4', { type: 'video/mp4' });
                const next = [...files, f1, f2];
                setFiles(next);
                setChatStep(1);
                setDirectorChat([
                  { 
                    sender: 'director', 
                    text: `Welcome to Creator Studio! I see you uploaded ${next.length} clips. Let's design the visual plan. What should be the primary storytelling narrative focus?`,
                    options: ["Memories & Mood", "High Motion & Action", "Balanced Scenery"]
                  }
                ]);
              } catch (err) {
                console.error(err);
              }
            }}
            className="w-full py-2.5 bg-white/[0.02] border border-dashed border-white/5 rounded-2xl text-[9px] font-black uppercase text-gray-500 hover:bg-white/[0.05] hover:text-white cursor-pointer transition-all text-center block mt-2"
          >
            [Dev Tool] Load Test Footage (Sample Clips)
          </button>

          {/* Scanned upload list (Pre-analysis) */}
          {files.length > 0 && storyboard.length === 0 && (
            <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block">Uploaded original clips ({files.length})</span>
              {files.map((file, idx) => (
                <div key={idx} className="glass-panel rounded-2xl p-4 border border-white/5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                      <FileVideo className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-white truncate">{file.name}</h4>
                      <p className="text-[8px] text-gray-500 font-bold mt-1 uppercase">Pending Curation Analysis</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveFile(idx)} className="text-gray-500 hover:text-red-400 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Storyboard Sequence */}
          {storyboard.length > 0 && (
            <div className="space-y-3.5 flex-1 overflow-y-auto no-scrollbar">
              <span className="text-[10px] text-accent font-black uppercase tracking-wider block flex items-center gap-1.5">
                <ListTodo className="w-4 h-4 text-accent" /> Multimodal Storyboard Sequence (AI Curated)
              </span>
              
              <div className="space-y-3">
                {storyboard.map((scene, idx) => {
                  const clipMeta = clipsMetadata.find(c => c.clipIndex === scene.clipIndex);
                  return (
                    <div key={idx} className="glass-panel border border-white/5 rounded-2xl p-3 flex flex-col gap-2 relative">
                      <div className="flex justify-between items-center border-b border-white/[0.03] pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-primary/25 border border-primary/35 text-white px-2 py-0.5 rounded-md font-black uppercase">
                            {scene.sceneTitle}
                          </span>
                          <span className="text-[9px] text-gray-500 font-extrabold truncate max-w-[140px]">
                            {clipMeta ? clipMeta.fileName : `Clip ${scene.clipIndex}`}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-gray-400 font-bold uppercase">
                            Trim: {scene.startTime.toFixed(1)}s for {scene.duration.toFixed(1)}s
                          </span>
                          
                          {/* Reordering */}
                          <div className="flex items-center gap-1">
                            <button 
                              disabled={idx === 0}
                              onClick={() => moveScene(idx, 'up')}
                              className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-30 cursor-pointer text-[10px]"
                            >
                              ▲
                            </button>
                            <button 
                              disabled={idx === storyboard.length - 1}
                              onClick={() => moveScene(idx, 'down')}
                              className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-30 cursor-pointer text-[10px]"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 bg-[#0c0817]/45 rounded-xl p-2.5 border border-white/[0.03] text-[9px] text-gray-400 font-semibold leading-relaxed">
                        <Sparkles className="w-3.5 h-3.5 text-accent shrink-0 fill-accent mt-0.5" />
                        <div>
                          <span className="text-white font-extrabold block mb-0.5">AI Rationale:</span>
                          <span>{scene.rationale}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Trigger Compile button */}
          <div className="pt-2">
            <button
              onClick={handleProcess}
              disabled={files.length === 0 || chatStep < 4}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                files.length === 0 || chatStep < 4
                  ? 'bg-white/[0.04] text-gray-600 border border-white/5 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary to-accent text-white shadow-[0_0_25px_rgba(139,92,246,0.35)] hover:scale-[1.01] active:scale-[0.98]'
              }`}
            >
              {chatStep < 4 && files.length > 0 ? "Complete Interview first" : "DIRECT REEL & EXPORT"} 
              <Wand2 className="w-4 h-4 fill-white" />
            </button>
          </div>

        </div>

      </div>

      {/* MUSIC MODAL */}
      <AnimatePresence>
        {showMusicDrawer && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0e0a1b] border border-white/10 rounded-3xl w-full max-w-lg h-[520px] flex flex-col p-6 overflow-hidden relative shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Soundtrack Directory</h2>
                <button onClick={() => setShowMusicDrawer(false)} className="text-gray-400 p-1.5 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex border-b border-white/5 mb-4 shrink-0 text-center text-[10px]">
                <button onClick={() => setMusicTab('foryou')} className={`flex-1 pb-3 font-black uppercase cursor-pointer ${musicTab==='foryou'?'text-primary border-b-2 border-primary':'text-gray-500'}`}>For You</button>
                <button onClick={() => setMusicTab('browse')} className={`flex-1 pb-3 font-black uppercase cursor-pointer ${musicTab==='browse'?'text-accent border-b-2 border-accent':'text-gray-500'}`}>Browse</button>
                <button onClick={() => setMusicTab('saved')} className={`flex-1 pb-3 font-black uppercase cursor-pointer ${musicTab==='saved'?'text-neon-gold border-b-2 border-neon-gold':'text-gray-500'}`}>Saved</button>
              </div>

              <div className="relative mb-4 shrink-0">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search soundtracks..." 
                  value={searchQuery} 
                  onChange={(e)=>setSearchQuery(e.target.value)}
                  className="w-full bg-[#120e1e] border border-white/5 rounded-2xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div onClick={()=>customAudioInputRef.current?.click()} className="mb-4 shrink-0 border border-dashed border-primary/30 rounded-2xl p-3 flex justify-between items-center cursor-pointer bg-primary/5 hover:bg-primary/10">
                <div className="flex items-center gap-3">
                  <UploadCloud className="w-5 h-5 text-primary shrink-0" />
                  <div className="text-[10px]">
                    <h4 className="font-extrabold text-white">Import Custom soundtrack</h4>
                    <p className="text-gray-500">Supports .mp3 or .wav music track</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pb-2">
                {displayedSongs.map((song) => (
                  <div key={song.id} onClick={()=>handleSelectSong(song)} className={`bg-white/[0.01] hover:bg-white/[0.03] border rounded-2xl p-2.5 flex items-center justify-between cursor-pointer ${selectedSong.id===song.id?'border-primary':'border-white/5'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-primary to-accent relative shrink-0">
                        <img src={song.thumbnail} alt="cover" className="w-full h-full object-cover" />
                        <div onClick={(e)=>handlePlayPreview(song,e)} className="absolute inset-0 bg-black/45 flex items-center justify-center cursor-pointer">
                          {isPlayingSongId===song.id?<Pause className="w-4 h-4 text-white fill-white"/>:<Play className="w-4 h-4 text-white fill-white ml-0.5"/>}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs text-white truncate">{song.title}</h4>
                        <p className="text-[9px] text-gray-500 font-bold mt-0.5">{song.artist}</p>
                      </div>
                    </div>
                    {selectedSong.id === song.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Upload;

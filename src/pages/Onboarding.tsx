import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Video, Cpu, Play, CheckCircle2, ChevronDown, Award, Shield, Zap, Globe, MessageSquare, Star } from 'lucide-react';

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-2 text-xs uppercase font-black tracking-wider text-gray-200 hover:text-white transition-colors cursor-pointer"
      >
        <span>{question}</span>
        <ChevronDown className={`w-4 h-4 text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-xs text-gray-400 leading-relaxed font-semibold pt-2 pb-4">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Onboarding = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Sparkles,
      title: "AI Creative Curation",
      desc: "Describe your editing vision in natural language. Gemini AI automatically analyzes intent to determine clip pacing, color grading filters, and write viral hashtags.",
      color: "text-accent bg-accent/10 border-accent/20"
    },
    {
      icon: Cpu,
      title: "AI Voiceover Sync",
      desc: "Generate premium, realistic narration script overlays instantly using ElevenLabs TTS. Duck background music automatically during voiceovers.",
      color: "text-primary bg-primary/10 border-primary/20"
    },
    {
      icon: Video,
      title: "Pro Transition Engine",
      desc: "Ditch boring hard cuts. Select White Flashes, Cinematic Fades, defocus Blurs, or speed-up Zooms designed to keep audiences hooked.",
      color: "text-secondary bg-secondary/10 border-secondary/20"
    }
  ];

  const pricingTiers = [
    {
      name: "Creator Free",
      price: "$0",
      desc: "Perfect for casual creators starting with AI editing.",
      features: [
        "720p Video Exports",
        "Standard Transition Filters",
        "Automatic Music Syncing",
        "5 AI Curation Runs / month",
        "Ad-Supported Rendering"
      ],
      cta: "Get Started Free",
      popular: false
    },
    {
      name: "Creator Pro",
      price: "$29",
      desc: "The ultimate AI assistant for daily content creators.",
      features: [
        "High-definition 1080p & 4K Exports",
        "Unlimited Curation Runs",
        "ElevenLabs Premium Voiceovers",
        "Pro Transition Packs (Hollywood, Travel)",
        "Priority Rendering Queue",
        "Remove Watermark Logo"
      ],
      cta: "Unlock Creator Pro",
      popular: true
    },
    {
      name: "Enterprise Studio",
      price: "$149",
      desc: "Designed for content agencies and commercial teams.",
      features: [
        "Everything in Creator Pro",
        "Dedicated API key access",
        "Custom Voice Cloning",
        "Multi-User Team Workspaces",
        "API Automation Access",
        "1-on-1 Cinematic Consulting"
      ],
      cta: "Contact Enterprise",
      popular: false
    }
  ];

  const testimonials = [
    {
      name: "Alex Rivera",
      role: "Travel Vlogger (800K+ followers)",
      quote: "RaagaReel completely replaced my editing timelines. I just describe my vlog vibe, and the sync engine spits out a viral-ready reel in seconds. Incredible!",
      avatar: "https://i.pravatar.cc/150?img=33"
    },
    {
      name: "Sarah Chen",
      role: "Fitness Influencer (1.2M+ views)",
      quote: "The White Flash transitions match my workouts perfectly. Combined with ElevenLabs auto-ducking narration, my conversion ratios skyrocketed.",
      avatar: "https://i.pravatar.cc/150?img=47"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-white flex flex-col relative overflow-hidden">
      {/* Background Neon Glow Elements */}
      <motion.div 
        animate={{ 
          scale: [1, 1.15, 1],
          x: [0, 40, 0],
          y: [0, -30, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/15 rounded-full blur-[140px] pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          scale: [1.1, 0.9, 1.1],
          x: [0, -40, 0],
          y: [0, 50, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[5%] right-[-10%] w-[450px] h-[450px] bg-accent/15 rounded-full blur-[120px] pointer-events-none" 
      />

      {/* Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-md font-black tracking-wider uppercase">RaagaReel <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded font-extrabold ml-1">AI</span></span>
        </div>
        <button 
          onClick={() => navigate('/home')}
          className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
        >
          Creator Studio Dashboard
        </button>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-6xl mx-auto px-6 pt-12 pb-20 flex flex-col lg:flex-row items-center gap-12 z-10">
        {/* Left Info Column */}
        <div className="flex-1 text-center lg:text-left space-y-6 max-w-xl lg:max-w-none">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-black uppercase tracking-widest text-accent animate-pulse"
          >
            <Sparkles className="w-3.5 h-3.5 fill-accent text-accent" /> Next-Gen Cinematic AI Curation
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.02] text-white"
          >
            Direct Your Story <br /><span className="text-gradient font-black">With AI</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-400 text-sm sm:text-md font-medium leading-relaxed"
          >
            Upload your memories. Describe your imagination. RaagaReel understands storytelling pacing, music triggers, and visual effects to export professional vertical clips automatically.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 pt-2 justify-center lg:justify-start"
          >
            <button
              onClick={() => navigate('/home')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-100 transition-all shadow-[0_4px_30px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Enter AI Studio
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('pricing');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-panel text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all cursor-pointer"
            >
              View Pricing Plans
            </button>
          </motion.div>
        </div>

        {/* Right Preview Device Column */}
        <div className="flex-1 w-full max-w-sm lg:max-w-none flex justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
            className="relative w-[280px] h-[500px] rounded-[36px] border-[6px] border-gray-900 bg-[#0e0a1b] shadow-[0_0_50px_rgba(139,92,246,0.2)] overflow-hidden flex flex-col p-4"
          >
            {/* Phone notch */}
            <div className="w-full flex justify-between items-center text-[8px] text-gray-500 font-bold mb-4 shrink-0 px-2">
              <span>9:41</span>
              <div className="w-16 h-3.5 bg-black rounded-full border border-white/5 flex items-center justify-center text-[7px] text-accent font-black tracking-wide uppercase">RaagaReel AI</div>
              <span>5G</span>
            </div>

            {/* Mock layout inside phone */}
            <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-3 flex flex-col justify-between overflow-hidden relative">
              <img 
                src="https://picsum.photos/seed/travel/200/300" 
                alt="preview" 
                className="absolute inset-0 w-full h-full object-cover opacity-40 rounded-2xl animate-pulse" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-black/40 rounded-2xl" />
              
              <div className="relative z-10 flex justify-between items-center">
                <span className="text-[7px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-black uppercase">Active Engine</span>
                <span className="text-[7px] bg-primary/30 text-white border border-primary/45 px-2 py-0.5 rounded font-black uppercase">Vivid Grade</span>
              </div>

              <div className="relative z-10 text-center space-y-1.5 pb-4">
                <span className="text-[8px] text-yellow-400 font-black tracking-widest uppercase block animate-pulse">Wait for it... 👀</span>
                <p className="text-[6px] text-gray-300 px-3 leading-relaxed font-semibold">"Unleash the Beast Within ⚡ Now rendering with beat-synchronized blurs."</p>
              </div>
            </div>

            {/* Direct button mockup */}
            <div className="mt-3 shrink-0">
              <div className="w-full py-3 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center gap-1.5 text-[9px] font-black text-white uppercase tracking-wider shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                <Sparkles className="w-3.5 h-3.5 fill-white text-white" /> Direct AI Reel
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Numerical Stats Row */}
      <section className="border-y border-white/5 py-12 bg-white/[0.01]">
        <div className="w-full max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-white">1.2M+</h3>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Reels Directed By AI</p>
          </div>
          <div className="space-y-1 border-y sm:border-y-0 sm:border-x border-white/5 py-4 sm:py-0">
            <h3 className="text-3xl font-black text-primary">98.4%</h3>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Aesthetic Pacing Sync</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-accent">15s</h3>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Average Render Export Speed</p>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-20 z-10">
        <div className="w-full max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary">Product Core</h3>
            <h2 className="text-3xl font-black tracking-tight text-white">Interactive Film Directing</h2>
            <p className="text-xs text-gray-400 leading-relaxed font-semibold">Transforming raw clips into highly stylized social media highlights.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, idx) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col space-y-4 hover:border-primary/20 hover:bg-white/[0.04] transition-all"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${f.color} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-white">{f.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed font-medium flex-1">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-surface/20 py-20 border-t border-white/5">
        <div className="w-full max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-accent">Social Proof</h3>
            <h2 className="text-3xl font-black tracking-tight text-white">Love from Creators</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((t, idx) => (
              <div key={idx} className="glass-panel border border-white/5 rounded-3xl p-6 flex items-start gap-4">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover shrink-0 border border-white/10" />
                <div className="space-y-2">
                  <p className="text-xs text-gray-300 italic font-medium leading-relaxed">"{t.quote}"</p>
                  <div>
                    <h4 className="text-xs font-black text-white">{t.name}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Grid */}
      <section id="pricing" className="py-20 border-t border-white/5">
        <div className="w-full max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary">Pricing Plans</h3>
            <h2 className="text-3xl font-black tracking-tight text-white">Start Directing Today</h2>
            <p className="text-xs text-gray-400 leading-relaxed font-semibold">Choose the plan suited for your editing frequency and video requirements.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, idx) => (
              <div 
                key={idx} 
                className={`glass-panel border rounded-[32px] p-8 flex flex-col relative overflow-hidden ${
                  tier.popular ? 'border-primary shadow-[0_0_30px_rgba(139,92,246,0.15)] bg-primary/[0.02]' : 'border-white/5'
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-4 right-4 bg-primary text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                
                <div className="mb-6 space-y-2">
                  <h4 className="text-sm font-black uppercase tracking-wider text-gray-400">{tier.name}</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">{tier.price}</span>
                    <span className="text-xs text-gray-500 font-semibold">/ month</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed font-medium">{tier.desc}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2.5 text-xs text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold">{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/home')}
                  className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    tier.popular 
                      ? 'bg-gradient-to-r from-primary to-accent text-white shadow-[0_0_15px_rgba(139,92,246,0.25)] hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ accordion */}
      <section className="py-20 border-t border-white/5 bg-surface/10">
        <div className="w-full max-w-4xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-accent">Questions</h3>
            <h2 className="text-3xl font-black tracking-tight text-white">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            <FAQItem 
              question="How does the AI Creative Curation work?" 
              answer="RaagaReel uses advanced AI (Gemini) to analyze your prompt and match it to a series of editing choices (clip duration pacing, transitions, visual grading). It also curates a custom narrative script overlay which is spoken by realistic ElevenLabs voiceovers, all mixed automatically."
            />
            <FAQItem 
              question="Can I upload custom music soundtracks?" 
              answer="Yes! In the AI Director Lab, you can choose from our curated categories (Telugu, Hindi, English, Punjabi in motivational, chill, or hype moods) or click the 'Upload Custom Soundtrack' panel to drag in your own audio files."
            />
            <FAQItem 
              question="What visual transitions are supported?" 
              answer="We offer five visually rich per-clip transitions: Rhythmic Cuts, Dip-to-Black Fades, Light Leak Exposures, defocus Box Blurs, and dynamic Zooming speed-ramps."
            />
            <FAQItem 
              question="Are my exported videos backed up to the cloud?" 
              answer="Yes, all premium exports on the Creator Pro and Enterprise tiers are backed up to our secure cloud storage dashboard so you can access your recent works from any browser."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-black mt-auto text-gray-500 text-xs font-semibold z-10 shrink-0">
        <div className="w-full max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary fill-primary" />
            <span>© 2026 RaagaReel AI Studio. All rights reserved.</span>
          </div>
          <div className="text-[10px] text-gray-400">
            Designed & Engineered by{" "}
            <a 
              href="/about" 
              className="text-primary hover:text-accent font-black transition-colors uppercase tracking-wider"
            >
              Kande Vamshi Krishna
            </a>{" "}
            | Google Student Ambassador
          </div>
          <div className="flex gap-6">
            <span className="hover:text-white cursor-pointer">Terms of Service</span>
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Onboarding;

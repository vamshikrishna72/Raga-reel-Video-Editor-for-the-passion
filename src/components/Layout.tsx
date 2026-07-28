import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, Video, Radio, Menu, X, Sparkles, LogOut, Cpu, User } from 'lucide-react';
import { getKeysStatus } from '../services/api';
import ParticleBackground from './ParticleBackground';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [keyStatus, setKeyStatus] = useState({ gemini: 'checking', elevenlabs: 'checking' });

  // Hide sidebar on the landing / onboarding page
  const isLanding = location.pathname === '/';

  useEffect(() => {
    if (!isLanding) {
      getKeysStatus().then((status: any) => {
        if (status) setKeyStatus(status);
      });
    }
  }, [location.pathname, isLanding]);

  const navItems = [
    { name: 'Dashboard', path: '/home', icon: HomeIcon },
    { name: 'Creator Lab', path: '/upload', icon: Video },
    { name: 'About Developer', path: '/about', icon: User },
  ];

  if (isLanding) {
    return (
      <div className="min-h-screen bg-black text-white overflow-x-hidden font-sans relative">
        <ParticleBackground />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row font-sans overflow-x-hidden relative">
      <ParticleBackground />
      {/* LEFT SIDEBAR - DESKTOP */}
      <aside className="hidden md:flex md:w-64 bg-[#0a0712] border-r border-white/5 flex-col p-6 shrink-0 relative">
        {/* Glow behind logo */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />
        
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 z-10 cursor-pointer" onClick={() => navigate('/home')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase text-white flex items-center gap-1">
              RaagaReel <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-extrabold uppercase">AI</span>
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5 flex-1 z-10">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[11px] font-black tracking-wider uppercase transition-all duration-200 cursor-pointer text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-primary/15 to-accent/5 border border-primary/25 text-white shadow-[0_0_15px_rgba(139,92,246,0.12)]'
                    : 'text-gray-400 hover:bg-white/[0.03] hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer - API Status Info */}
        <div className="mt-auto border-t border-white/5 pt-4 space-y-3 z-10">
          <div className="glass-panel rounded-2xl p-3.5 text-[10px] space-y-2">
            <span className="font-black text-gray-500 uppercase tracking-widest block mb-1 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-primary" /> API Integrations
            </span>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium">Gemini AI</span>
              <span className={`w-2 h-2 rounded-full ${
                keyStatus.gemini === 'working' ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' :
                keyStatus.gemini === 'missing' ? 'bg-amber-400' : 'bg-red-400'
              }`} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium">ElevenLabs Voice</span>
              <span className={`w-2 h-2 rounded-full ${
                keyStatus.elevenlabs === 'working' ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' :
                keyStatus.elevenlabs === 'missing' ? 'bg-amber-400' : 'bg-red-400'
              }`} />
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/')} 
            className="w-full py-3 rounded-xl border border-white/5 hover:border-red-500/30 text-gray-400 hover:text-red-400 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Product Page
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden bg-[#0a0712] border-b border-white/5 p-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2" onClick={() => navigate('/home')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-sm font-black tracking-wider uppercase text-white">RaagaReel AI</h1>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-400 p-1 hover:text-white">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* MOBILE DRAWER MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-[#0c0817] border-b border-white/5 overflow-hidden sticky top-[65px] z-30"
          >
            <div className="p-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider cursor-pointer text-left ${
                    location.pathname === item.path
                      ? 'bg-primary/20 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4 text-primary" />
                  {item.name}
                </button>
              ))}
              <button 
                onClick={() => {
                  navigate('/');
                  setMobileMenuOpen(false);
                }} 
                className="w-full py-2.5 rounded-xl border border-white/5 text-gray-400 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Product Page
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN SCREEN AREA */}
      <main className="flex-1 flex flex-col min-h-0 bg-background relative overflow-y-auto no-scrollbar">
        {/* Glow in the background */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="flex-1 flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Layout;

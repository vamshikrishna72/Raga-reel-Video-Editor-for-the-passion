import React from 'react';
import { motion } from 'framer-motion';
import { Mail, ExternalLink, Sparkles, BrainCircuit, Terminal, GraduationCap, Briefcase } from 'lucide-react';

const About = () => {
  const profileImg = "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/04d041b1-c75c-4021-9d7d-222ebd9d5089/id-preview-6c1a964a--c53eea9c-028f-460c-816b-f8eacba6d4cd.lovable.app-1773559170300.png";

  const skillCategories = [
    {
      title: "Machine Learning & DL",
      icon: BrainCircuit,
      skills: ["Supervised/Unsupervised Learning", "Deep Neural Networks", "Natural Language Processing (NLP)", "Computer Vision (CV)", "Scikit-Learn, PyTorch, TensorFlow"]
    },
    {
      title: "Generative AI & LLMs",
      icon: Sparkles,
      skills: ["Large Language Models (LLMs)", "Prompt Engineering", "Retrieval-Augmented Generation (RAG)", "LangChain, LlamaIndex", "Vector Databases (ChromaDB, Pinecone)"]
    },
    {
      title: "Core Software & Ops",
      icon: Terminal,
      skills: ["Python (Django, Flask, FastAPI)", "Java (Spring Boot)", "Git / GitHub / CI-CD", "RESTful APIs", "Docker & Cloud Deployments"]
    }
  ];

  return (
    <div className="flex flex-col flex-1 bg-background p-2 sm:p-6 overflow-y-auto no-scrollbar pb-20 relative">
      {/* Glow effects */}
      <div className="absolute top-10 left-10 w-48 h-48 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-64 h-64 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 border-b border-white/5 pb-4"
      >
        <span className="text-gray-400 text-[10px] font-black tracking-widest uppercase">Platform Developer</span>
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5 mt-1">
          <BrainCircuit className="w-5 h-5 text-primary" /> Meet the Developer
        </h1>
      </motion.div>

      {/* Main Profile Panel */}
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Avatar & Bio */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-5 flex flex-col items-center text-center p-6 bg-surface/50 border border-white/5 rounded-3xl relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-primary to-accent" />
          
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-primary/30 shadow-[0_0_20px_rgba(139,92,246,0.25)] mb-4">
            <img src={profileImg} alt="Kande Vamshi Krishna" className="w-full h-full object-cover" />
          </div>

          <h2 className="text-lg font-black text-white">Kande Vamshi Krishna</h2>
          <p className="text-xs text-primary font-extrabold uppercase tracking-wider mt-1">ML Engineer & AI Specialist</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Hyderabad, India</p>

          <p className="text-xs font-semibold text-gray-400 leading-relaxed mt-4 border-t border-white/5 pt-4 text-justify">
            Hello! I am Kande Vamshi Krishna, a passionate Machine Learning and AI Specialist. I specialize in building intelligent pipelines, fine-tuning deep learning networks, and designing generative workflows that bring creative AI ideas to life.
          </p>

          {/* Social connections */}
          <div className="flex gap-3 mt-6">
            <a 
              href="https://github.com/vamshikrishna72" 
              target="_blank" 
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all border border-white/5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </a>
            <a 
              href="https://www.linkedin.com/in/kandevamshikrishna/" 
              target="_blank" 
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all border border-white/5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect width="4" height="12" x="2" y="9" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            <a 
              href="mailto:vamshikande72@gmail.com" 
              className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all border border-white/5"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>

          {/* Portfolio button */}
          <a 
            href="https://kandevamshikrishnaportfolio.vercel.app/" 
            target="_blank" 
            rel="noreferrer"
            className="w-full mt-6 py-3 rounded-2xl bg-gradient-to-r from-primary to-accent hover:scale-[1.01] active:scale-[0.98] transition-all font-black text-[10px] tracking-widest uppercase text-white flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
          >
            Visit Live Portfolio <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </motion.div>

        {/* Right Side: Skills & Core details */}
        <div className="md:col-span-7 space-y-6">
          
          {/* Quick info grid */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-primary shrink-0" />
              <div>
                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">Role</span>
                <span className="text-xs font-extrabold text-white">Google Student Ambassador</span>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-accent shrink-0" />
              <div>
                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">Education</span>
                <span className="text-xs font-extrabold text-white">Computer Science Undergrad</span>
              </div>
            </div>
          </motion.div>

          {/* Core Skills categories */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Core Technical Expertise</h3>
            
            {skillCategories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div key={idx} className="glass-panel border border-white/5 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-accent tracking-wider">
                    <Icon className="w-4 h-4 text-primary" /> {cat.title}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.skills.map((skill, sIdx) => (
                      <span 
                        key={sIdx}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/5 text-[9px] font-bold text-gray-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>

        </div>

      </div>
    </div>
  );
};

export default About;

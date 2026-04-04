import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import HeroBackground from './HeroBackground';
import { cn } from '../lib/utils';

const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <HeroBackground />
      
      <div className="container mx-auto px-6 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="animate-float"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-blue text-xs font-bold uppercase tracking-widest mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-blue opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-blue"></span>
              </span>
              Now in Private Beta
            </div>
            
            <h1 className="text-5xl md:text-8xl font-display font-bold leading-[0.8] tracking-tighter mb-10 text-slate-900 dark:text-white">
              Cut Through <br />
              <span className="text-gradient">The Noise.</span>
            </h1>
            
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              The world's first real-time AI news intelligence platform. <br className="hidden md:block" />
              Every story verified. Every claim checked. Every perspective shown.
            </p>

            <div className="flex flex-wrap justify-center gap-6">
              <a
                href="/login"
                className="px-10 py-5 bg-brand-blue hover:bg-blue-600 text-white rounded-2xl font-bold transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/40 active:scale-95 text-lg"
              >
                Sign Up Now
              </a>
              <a href="/login" className="px-10 py-5 glass dark:glass-dark text-slate-900 dark:text-white rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 text-lg">
                Login
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-brand-blue to-transparent" />
      </motion.div>
    </section>
  );
};

export default HeroSection;

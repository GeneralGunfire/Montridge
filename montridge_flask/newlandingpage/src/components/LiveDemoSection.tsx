import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const LiveDemoSection: React.FC = () => {
  const articles = [
    { title: "Global Energy Crisis Averted with Fusion Breakthrough", source: "Reuters", category: "Science", emoji: "⚡" },
    { title: "New Trade Agreement Signed Between G7 Nations", source: "Bloomberg", category: "Economy", emoji: "🤝" },
    { title: "AI Ethics Board Proposes Universal Standards", source: "BBC News", category: "Tech", emoji: "🤖" },
  ];

  return (
    <section className="py-24 md:py-32 bg-light-bg dark:bg-dark-bg">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-bold mb-6"
          >
            See Montridge in Action
          </motion.h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Background Glow */}
          <div className="absolute -inset-10 bg-brand-blue/10 blur-[120px] rounded-full -z-10" />

          {/* Mockup Container */}
          <div className="bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">
            <div className="scanline" />
            
            {/* Mockup Nav */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-brand-blue rounded-sm flex items-center justify-center text-white font-bold text-xs">M</div>
                <span className="text-white font-display font-bold text-sm">Montridge</span>
              </div>
              <div className="flex gap-2">
                {['Normal', 'Insights', 'Topics', 'Daily Debrief'].map((pill, i) => (
                  <div key={pill} className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold",
                    i === 0 ? "bg-brand-blue text-white" : "bg-white/5 text-slate-400"
                  )}>
                    {pill}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live</span>
              </div>
            </div>

            {/* Breaking Bar */}
            <div className="bg-red-600/20 border-y border-red-600/30 py-2 px-4 overflow-hidden">
              <motion.div 
                animate={{ x: ['100%', '-100%'] }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="whitespace-nowrap text-[10px] font-bold text-red-500 uppercase tracking-widest"
              >
                BREAKING NEWS: MAJOR TECH MERGER ANNOUNCED IN SILICON VALLEY • GLOBAL MARKETS REACT TO UNEXPECTED SHIFT • 
              </motion.div>
            </div>

            {/* Content */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {articles.map((article, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">{article.source}</span>
                    <span className="text-lg">{article.emoji}</span>
                  </div>
                  <h4 className="text-white font-bold text-sm leading-tight mb-4">{article.title}</h4>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-brand-blue/20 text-brand-blue rounded text-[8px] font-bold uppercase">{article.category}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                      <span className="text-[8px] text-slate-500">98% Verified</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Mockup Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20 flex justify-center">
              <div className="w-32 h-1 bg-white/10 rounded-full" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LiveDemoSection;

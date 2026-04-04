import React from 'react';
import { motion } from 'motion/react';

const TrustSection: React.FC = () => {
  const sources = [
    "BBC", "Reuters", "Financial Times", "Al Jazeera", "Bloomberg", 
    "The Guardian", "NPR", "TechCrunch", "Ars Technica", "Nature", "MarketWatch"
  ];

  return (
    <section className="py-24 bg-light-bg dark:bg-dark-bg border-y border-slate-200 dark:border-white/5 overflow-hidden">
      <div className="container mx-auto px-6 mb-12 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-display font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"
        >
          Powered By The World's Most Trusted Sources
        </motion.h2>
      </div>

      <div className="relative flex flex-col gap-8">
        {/* Row 1 */}
        <div className="flex whitespace-nowrap overflow-hidden">
          <div className="flex gap-8 animate-scroll-left">
            {[...sources, ...sources].map((source, i) => (
              <div 
                key={i}
                className="px-8 py-3 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-mono text-sm font-bold hover:border-brand-blue transition-colors cursor-default"
              >
                {source}
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex whitespace-nowrap overflow-hidden">
          <div className="flex gap-8 animate-scroll-right">
            {[...sources, ...sources].map((source, i) => (
              <div 
                key={i}
                className="px-8 py-3 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-mono text-sm font-bold hover:border-brand-blue transition-colors cursor-default"
              >
                {source}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;

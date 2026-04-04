import React from 'react';
import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import iconsImage from '../public/icons.jpeg';
import iconsDarkImage from '../public/iconsdark.png';
import { useTheme } from '../context/ThemeContext';

const ProblemSection: React.FC = () => {
  const { theme } = useTheme();

  return (
    <section id="problem" className="py-32 relative overflow-hidden bg-white dark:bg-[#05070A]">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-6 space-y-12">
            <div className="max-w-xl">
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-6xl font-display font-bold mb-8 leading-[0.9] tracking-tighter"
              >
                The News Is <span className="italic text-slate-400">Broken.</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-sm md:text-base text-slate-500 max-w-2xl leading-relaxed mb-12"
              >
                We are drowning in information but starving for truth. Fragmentation, bias, and speed have destroyed our ability to understand the world.
              </motion.p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[
                  { val: "74%", label: "Overwhelmed by volume" },
                  { val: "6×", label: "Faster misinformation" },
                  { val: "2hrs", label: "Wasted daily on noise" },
                  { val: "90%", label: "Bias in top outlets" }
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5"
                  >
                    <div className="text-2xl font-display font-bold text-brand-blue mb-1">{stat.val}</div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute -inset-4 bg-gradient-to-tr from-brand-blue/20 to-brand-cyan/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <img
                src={theme === 'dark' ? iconsDarkImage : iconsImage}
                alt="Montridge Intelligence"
                className="w-full h-auto rounded-[2.5rem] shadow-2xl relative z-10 border border-slate-200 dark:border-white/10"
              />
              
              <div className="absolute -bottom-6 -right-6 glass dark:glass-dark p-8 rounded-3xl z-20 max-w-[280px] hidden md:block border border-slate-200 dark:border-white/10 shadow-2xl">
                <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <h4 className="text-lg font-display font-bold mb-2">The Intelligence Gap</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Traditional outlets are optimized for clicks, not clarity. We bridge the gap between noise and knowledge.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;

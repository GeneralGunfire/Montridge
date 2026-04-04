import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart3, ShieldCheck, GitBranch, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay: number;
  children?: React.ReactNode;
}> = ({ icon, title, desc, delay, children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay }}
      className="animate-float"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="group relative bg-white dark:bg-slate-800/50 p-8 rounded-3xl border border-slate-100 dark:border-white/10 hover:border-brand-blue/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 h-full flex flex-col">
        <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue mb-6 group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>
        <h3 className="text-2xl font-display font-bold mb-4 text-slate-900 dark:text-white">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 flex-grow">
          {desc}
        </p>
        <div className="mt-auto">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-32 bg-slate-50 dark:bg-[#080A0F]">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-display font-bold mb-6 leading-[0.9] tracking-tighter"
          >
            Intelligence, <br />
            <span className="text-slate-400">Not Just Aggregation.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 md:grid-rows-2 gap-6 h-auto md:h-[800px]">
          {/* Signal Score - Large Featured Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-4 md:row-span-1 bento-card bg-white dark:bg-white/5 border-slate-100 dark:border-white/10 group overflow-hidden"
          >
            <div className="flex flex-col md:flex-row gap-8 h-full items-center">
              <div className="flex-1 z-10">
                <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue mb-6 group-hover:scale-110 transition-transform duration-500">
                  <BarChart3 size={24} />
                </div>
                <h3 className="text-xl font-display font-bold mb-4">Signal Score™</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8">
                  Every story gets a 0–100 global importance rating. The most important story always appears first.
                </p>
                <div className="flex gap-2">
                  {[87, 42, 12].map((s, i) => (
                    <div key={i} className="px-4 py-2 rounded-lg bg-slate-50 dark:bg-white/5 text-xs font-bold font-mono border border-slate-100 dark:border-white/5">
                      Signal {s}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-brand-blue/5 blur-3xl rounded-full" />
                <div className="relative w-40 h-40 md:w-48 md:h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-slate-100 dark:text-white/5"
                    />
                    <motion.circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray="502.4"
                      initial={{ strokeDashoffset: 502.4 }}
                      whileInView={{ strokeDashoffset: 502.4 * (1 - 0.87) }}
                      viewport={{ once: true }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      className="text-brand-blue"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-display font-bold">87</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Signal</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Real-Time Verification - Accent Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2 md:row-span-1 bento-card bg-brand-blue text-white border-transparent flex flex-col justify-center overflow-hidden relative"
          >
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-2xl font-display font-bold mb-4">Real-Time Verification</h3>
              <p className="text-blue-100 text-sm leading-relaxed">
                We verify while the story is breaking — not days later. Our AI cross-references sources in milliseconds.
              </p>
            </div>
          </motion.div>

          {/* Perspectives - Standard Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2 md:row-span-1 bento-card bg-white dark:bg-white/5 border-slate-100 dark:border-white/10 flex flex-col justify-center"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan mb-6">
              <GitBranch size={24} />
            </div>
            <h3 className="text-xl font-display font-bold mb-4">Perspectives</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              See Left, Centre, and Right sources simultaneously. Understand the bias before you read.
            </p>
          </motion.div>

          {/* Context Engine - Large Dark Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="md:col-span-4 md:row-span-1 bento-card bg-slate-900 text-white border-transparent overflow-hidden relative flex items-center"
          >
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center w-full">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-xl font-display font-bold mb-4">Context Engine</h3>
                <p className="text-slate-400 max-w-md text-xs leading-relaxed">
                  Auto-generated explainers for every story. No more assuming you know the background. We provide the "why" behind the "what".
                </p>
              </div>
              <div className="flex-1 hidden md:block">
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-2 bg-white/5 rounded-full w-full overflow-hidden">
                      <motion.div 
                        initial={{ x: '-100%' }}
                        whileInView={{ x: '0%' }}
                        transition={{ duration: 1, delay: 0.5 + (i * 0.2) }}
                        className="h-full bg-brand-blue/40 w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-20 pointer-events-none">
              <div className="w-full h-full bg-gradient-to-tl from-brand-blue to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

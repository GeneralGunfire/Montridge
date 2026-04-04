import React from 'react';
import { motion } from 'motion/react';
import { Search, Cpu, Zap, ShieldCheck } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: <Search className="text-brand-blue" size={32} />,
      title: "Ingest",
      description: "We scan 50,000+ global sources in real-time, from mainstream media to niche technical journals."
    },
    {
      icon: <Cpu className="text-brand-blue" size={32} />,
      title: "Analyze",
      description: "Our proprietary AI models cross-reference claims, detect bias, and identify the core 'Signal' of every story."
    },
    {
      icon: <Zap className="text-brand-blue" size={32} />,
      title: "Synthesize",
      description: "Complex events are distilled into high-density briefs, showing you all perspectives without the filler."
    },
    {
      icon: <ShieldCheck className="text-brand-blue" size={32} />,
      title: "Verify",
      description: "Every fact is triple-checked against primary sources and historical data to ensure 99.9% accuracy."
    }
  ];

  return (
    <section id="how-it-works" className="py-32 bg-slate-50 dark:bg-[#080A0F] overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-display font-bold mb-6 leading-[0.9] tracking-tighter"
          >
            The Intelligence <span className="text-brand-blue">Engine.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm text-slate-500 dark:text-slate-400"
          >
            How Montridge transforms the chaotic global news cycle into actionable intelligence.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative p-8 rounded-[2rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-brand-blue/30 transition-all group"
            >
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20 z-10">
                {i + 1}
              </div>
              <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 w-fit group-hover:scale-110 transition-transform duration-500">
                {step.icon}
              </div>
              <h3 className="text-lg font-display font-bold mb-4">{step.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

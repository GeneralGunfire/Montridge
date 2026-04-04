import React from 'react';
import { motion } from 'motion/react';
import { Zap, AlertTriangle, CreditCard, Smartphone, Wrench, Target } from 'lucide-react';

const ReasonCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay: number;
}> = ({ icon, title, desc, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="bg-white/5 dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-brand-blue/50 transition-all group"
    >
      <div className="text-brand-blue mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h4 className="font-display font-bold text-slate-900 dark:text-white mb-1">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
    </motion.div>
  );
};

const WhyNowSection: React.FC = () => {
  const reasons = [
    { icon: <Zap size={24} />, title: "AI Maturity", desc: "LLMs finally accurate enough", delay: 0.1 },
    { icon: <AlertTriangle size={24} />, title: "Trust Crisis", desc: "Misinformation at all-time high", delay: 0.2 },
    { icon: <CreditCard size={24} />, title: "Subscription Acceptance", desc: "Users pay for quality", delay: 0.3 },
    { icon: <Smartphone size={24} />, title: "Mobile-First", desc: "80% of news consumed on phones", delay: 0.4 },
    { icon: <Wrench size={24} />, title: "Tool Availability", desc: "Full stack achievable at zero cost", delay: 0.5 },
    { icon: <Target size={24} />, title: "Market Gap", desc: "Nobody does real-time verification at scale", delay: 0.6 },
  ];

  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/10 via-transparent to-purple-500/10 dark:from-brand-blue/20 dark:to-black -z-10" />
      
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-display font-bold mb-6"
          >
            The Window Is Now
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 dark:text-slate-400"
          >
            2–3 years before the tech giants copy this. First-mover advantage is everything.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((reason, i) => (
            <ReasonCard key={i} {...reason} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyNowSection;

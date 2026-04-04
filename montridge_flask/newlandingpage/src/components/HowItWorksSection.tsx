import React from 'react';
import { motion } from 'motion/react';
import { Database, ShieldCheck, Cpu, BarChart3, UserCheck } from 'lucide-react';

const PipelineNode: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  desc: string; 
  delay: number;
  tooltip: string;
}> = ({ icon, title, desc, delay, tooltip }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="relative group flex flex-col items-center text-center w-full md:w-auto"
    >
      <div className="relative z-10 w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-brand-blue mb-4 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-blue-500/20 border border-slate-100 dark:border-white/10">
        {icon}
        
        {/* Tooltip */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {tooltip}
        </div>
      </div>
      
      <h4 className="font-display font-bold text-slate-900 dark:text-white mb-2">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[150px] leading-relaxed">
        {desc}
      </p>
    </motion.div>
  );
};

const HowItWorksSection: React.FC = () => {
  const nodes = [
    { icon: <Database size={32} />, title: "500+ Sources", desc: "Global wires, local news, and social feeds.", tooltip: "Ingesting 1M+ articles daily" },
    { icon: <ShieldCheck size={32} />, title: "AI Verification", desc: "Cross-referencing claims in milliseconds.", tooltip: "99.9% accuracy rating" },
    { icon: <Cpu size={32} />, title: "Context Engine", desc: "Building the background story automatically.", tooltip: "Neural knowledge graph" },
    { icon: <BarChart3 size={32} />, title: "Visualizations", desc: "Complex data turned into clear insights.", tooltip: "Real-time sentiment mapping" },
    { icon: <UserCheck size={32} />, title: "You", desc: "The truth, delivered without the noise.", tooltip: "Personalized intelligence" },
  ];

  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-light-bg dark:bg-dark-bg overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-bold mb-6"
          >
            Intelligence, Not Just Aggregation
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 dark:text-slate-400"
          >
            While others collect headlines, Montridge builds understanding
          </motion.p>
        </div>

        <div className="relative">
          {/* Pipeline Line */}
          <div className="absolute top-10 left-0 right-0 h-0.5 bg-slate-200 dark:bg-white/10 hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-blue to-transparent w-1/3 animate-[move-gradient_3s_linear_infinite]" />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-12 md:gap-4 relative">
            {nodes.map((node, i) => (
              <PipelineNode key={i} {...node} delay={i * 0.2} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes move-gradient {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </section>
  );
};

export default HowItWorksSection;

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Globe, Clock } from 'lucide-react';

const PersonaCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay: number;
}> = ({ icon, title, desc, delay }) => {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        transition: 'transform 0.1s ease-out'
      }}
      className="bg-white dark:bg-slate-800/50 p-8 rounded-3xl border border-slate-100 dark:border-white/10 shadow-xl"
    >
      <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue mb-6">
        {icon}
      </div>
      <h3 className="text-2xl font-display font-bold mb-4 text-slate-900 dark:text-white">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
        {desc}
      </p>
    </motion.div>
  );
};

const WhoItsForSection: React.FC = () => {
  return (
    <section id="who-its-for" className="py-32 bg-white dark:bg-[#05070A]">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-display font-bold leading-[0.9] tracking-tighter"
            >
              Built For The <br />
              <span className="text-brand-blue">Truth Seekers.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-500 dark:text-slate-400 max-w-sm text-sm leading-relaxed"
            >
              Montridge isn't for everyone. It's for those who value depth over speed, and clarity over consensus.
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: "The Analyst", 
                desc: "Know the market-moving story before your competitors. Cut through the PR noise and find the signal.", 
                icon: <TrendingUp size={24} />,
                tag: "High Stakes"
              },
              { 
                title: "The Citizen", 
                desc: "Finally understand what's actually happening without bias. See all sides of the story in one place.", 
                icon: <Globe size={24} />,
                tag: "Critical Thinking"
              },
              { 
                title: "The Professional", 
                desc: "Stay informed with a 5-minute morning brief. High-density information for high-stakes decisions.", 
                icon: <Clock size={24} />,
                tag: "Efficiency"
              }
            ].map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-10 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-brand-blue/30 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5"
              >
                <div className="flex justify-between items-start mb-10">
                  <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue group-hover:scale-110 group-hover:bg-brand-blue group-hover:text-white transition-all duration-500">
                    {p.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full">
                    {p.tag}
                  </span>
                </div>
                <h4 className="text-xl font-display font-bold mb-4 group-hover:text-brand-blue transition-colors">{p.title}</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhoItsForSection;

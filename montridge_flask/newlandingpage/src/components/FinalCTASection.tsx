import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

const FinalCTASection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
    }
  };

  return (
    <section id="beta" className="py-48 relative overflow-hidden bg-slate-50 dark:bg-[#080A0F]">
      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-4xl md:text-7xl font-display font-bold mb-10 leading-[0.8] tracking-tighter text-slate-900 dark:text-white">
            Ready to Find <br />
            <span className="text-gradient">What Matters?</span>
          </h2>
          <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 mb-16 max-w-2xl mx-auto leading-relaxed">
            Join 1,000+ early access users. The future of news intelligence is here.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto mb-12">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitted}
              className="w-full px-10 py-6 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl text-xl focus:outline-none focus:border-brand-blue transition-all text-slate-900 dark:text-white shadow-xl"
              required
            />
            <button
              type="submit"
              disabled={isSubmitted}
              className={`whitespace-nowrap px-12 py-6 rounded-3xl font-bold text-xl transition-all flex items-center justify-center gap-3 ${
                isSubmitted 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-brand-blue hover:bg-blue-600 text-white hover:scale-105 active:scale-95 shadow-2xl shadow-blue-500/40'
              }`}
            >
              {isSubmitted ? (
                <>
                  <Check size={24} />
                  You're on the list!
                </>
              ) : (
                'Join the Beta'
              )}
            </button>
          </form>

          <div className="flex flex-wrap justify-center gap-6">
            <a href="/login" className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 text-lg">
              Sign Up Now
            </a>
            <a href="/login" className="px-8 py-4 glass dark:glass-dark text-slate-900 dark:text-white rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 text-lg">
              Login
            </a>
          </div>
        </motion.div>
      </div>
      
      {/* Background Decorative Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 opacity-30">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-blue/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-cyan/20 rounded-full blur-[150px]" />
      </div>
    </section>
  );
};

export default FinalCTASection;

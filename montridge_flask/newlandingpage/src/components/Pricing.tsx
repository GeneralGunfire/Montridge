import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

const Pricing: React.FC = () => {
  const plans = [
    {
      name: "Standard",
      price: "Free",
      description: "For the informed citizen.",
      features: [
        "Real-time news feed",
        "Basic Signal Score™",
        "Daily morning brief",
        "3 saved topics"
      ],
      cta: "Get Started",
      highlight: false
    },
    {
      name: "Pro",
      price: "$29",
      period: "/mo",
      description: "For the power analyst.",
      features: [
        "Advanced Signal Filtering",
        "Full Source Transparency",
        "Custom Intelligence Alerts",
        "Unlimited saved topics",
        "API Access (Limited)"
      ],
      cta: "Start Free Trial",
      highlight: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For high-stakes organizations.",
      features: [
        "Full API Integration",
        "Dedicated Intelligence Analyst",
        "Custom AI Model Training",
        "SLA & Priority Support",
        "White-label Reports"
      ],
      cta: "Contact Sales",
      highlight: false
    }
  ];

  return (
    <section id="pricing" className="py-32 bg-white dark:bg-[#05070A]">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-display font-bold mb-6 leading-[0.9] tracking-tighter"
          >
            Simple, Transparent <span className="text-brand-blue">Pricing.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm text-slate-500 dark:text-slate-400"
          >
            Choose the plan that fits your intelligence needs.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-10 rounded-[2.5rem] border transition-all duration-500 flex flex-col ${
                plan.highlight 
                  ? 'bg-brand-blue text-white border-brand-blue shadow-2xl shadow-blue-500/30 scale-105 z-10' 
                  : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 hover:border-brand-blue/30'
              }`}
            >
              <h3 className="text-lg font-display font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-display font-bold">{plan.price}</span>
                {plan.period && <span className="text-lg opacity-70">{plan.period}</span>}
              </div>
              <p className={`mb-8 ${plan.highlight ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                {plan.description}
              </p>
              
              <div className="space-y-4 mb-10 flex-grow">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className={`p-1 rounded-full ${plan.highlight ? 'bg-white/20' : 'bg-brand-blue/10 text-brand-blue'}`}>
                      <Check size={14} />
                    </div>
                    <span className="text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <button className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-95 ${
                plan.highlight 
                  ? 'bg-white text-brand-blue hover:bg-blue-50' 
                  : 'bg-brand-blue text-white hover:bg-blue-600'
              }`}>
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  TrendingUp,
  Cpu,
  Activity,
  ShieldAlert,
  Leaf,
  Users,
  DollarSign,
  Circle,
  BarChart3,
  Network,
  ChevronLeft,
  ArrowRight,
  Check,
} from 'lucide-react';

type Topic = { id: string; name: string; icon: React.ReactNode };
type ExpertiseLevel = 'Essential' | 'Standard' | 'Expert';
type ExpertiseOption = { id: ExpertiseLevel; title: string; description: string; icon: React.ReactNode };

const TOPICS: Topic[] = [
  { id: 'politics', name: 'Politics & World Affairs', icon: <Globe className="w-5 h-5" /> },
  { id: 'business', name: 'Business & Markets', icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'tech', name: 'Technology', icon: <Cpu className="w-5 h-5" /> },
  { id: 'science', name: 'Science & Health', icon: <Activity className="w-5 h-5" /> },
  { id: 'security', name: 'Conflicts & Security', icon: <ShieldAlert className="w-5 h-5" /> },
  { id: 'environment', name: 'Environment & Climate', icon: <Leaf className="w-5 h-5" /> },
  { id: 'culture', name: 'Culture & Society', icon: <Users className="w-5 h-5" /> },
  { id: 'finance', name: 'Finance & Economics', icon: <DollarSign className="w-5 h-5" /> },
];

const EXPERTISE_OPTIONS: ExpertiseOption[] = [
  {
    id: 'Essential',
    title: 'Essential',
    description: 'Key facts and headlines. Fast and clear. Best for staying informed quickly.',
    icon: <Circle className="w-6 h-6" />,
  },
  {
    id: 'Standard',
    title: 'Standard',
    description: 'Full context, background, and analysis. Best for most readers.',
    icon: <BarChart3 className="w-6 h-6" />,
  },
  {
    id: 'Expert',
    title: 'Expert',
    description: 'Deep analysis, entity relationships, and full source breakdown. Best for researchers and professionals.',
    icon: <Network className="w-6 h-6" />,
  },
];

// M lettermark SVG
const MLogoMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M 15 65 V 15 L 40 40 L 65 15 V 65" fill="white" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Premium progress indicator — thin line + numbered circles
const StepIndicator = ({ currentStep }: { currentStep: number }) => {
  return (
    <div className="flex items-center justify-center gap-0 mb-14 w-full max-w-xs mx-auto">
      {[1, 2, 3].map((step, idx) => {
        const isCompleted = currentStep > step;
        const isCurrent = currentStep === step;
        const isUpcoming = currentStep < step;

        return (
          <React.Fragment key={step}>
            {/* Step circle */}
            <div className="relative flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                style={{
                  background: isCompleted ? '#00b4d8' : isCurrent ? 'transparent' : '#111111',
                  border: isCompleted ? '2px solid #00b4d8' : isCurrent ? '2px solid #00b4d8' : '2px solid #333333',
                  color: isCompleted ? '#000' : isCurrent ? '#00b4d8' : '#555555',
                  boxShadow: isCurrent ? '0 0 12px rgba(0,180,216,0.4)' : undefined,
                }}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step}
              </div>
            </div>

            {/* Connector line */}
            {idx < 2 && (
              <div className="flex-1 h-px mx-1 relative overflow-hidden" style={{ background: '#222222' }}>
                <motion.div
                  className="absolute inset-y-0 left-0 h-full"
                  style={{ background: '#00b4d8' }}
                  initial={{ width: '0%' }}
                  animate={{ width: currentStep > step ? '100%' : '0%' }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Completion animation (progress bar)
const CompletionBar = () => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(100), 100);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="w-48 h-0.5 bg-[#1a1a1a] rounded-full overflow-hidden mt-8">
      <div
        className="h-full bg-[#00b4d8] rounded-full transition-all duration-[1800ms] ease-in-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState<number | 'completion'>(1);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [expertiseLevel, setExpertiseLevel] = useState<ExpertiseLevel>('Standard');
  const pageRef = useRef<HTMLDivElement>(null);

  const handleSkip = () => {
    window.location.href = '/dashboard';
  };

  const toggleTopic = (id: string) => {
    setSelectedTopics(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    setCurrentStep('completion');
    try {
      const token = localStorage.getItem('jwt_token');
      await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ topics: selectedTopics, expertise_level: expertiseLevel }),
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
    setTimeout(() => {
      if (pageRef.current) {
        pageRef.current.style.transition = 'opacity 400ms ease';
        pageRef.current.style.opacity = '0';
      }
      setTimeout(() => { window.location.href = '/dashboard'; }, 400);
    }, 2000);
  };

  const handleBack = (targetStep: number) => {
    setCurrentStep(targetStep);
  };

  return (
    <div ref={pageRef} className="min-h-screen bg-[#05050A] text-white font-sans selection:bg-[#00b4d8]/30 relative overflow-hidden">
      {/* Radial glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(0, 180, 216, 0.06) 0%, transparent 60%)' }}
      />

      <AnimatePresence mode="wait">
        {/* ── STEP 1 — Welcome ── */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 text-center max-w-2xl mx-auto"
          >
            <StepIndicator currentStep={1} />

            {/* Logo */}
            <div className="w-20 h-20 mb-8 flex-shrink-0">
              <MLogoMark className="w-full h-full" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-white">
              Welcome to Montridge
            </h1>
            <p className="text-[#888888] text-lg mb-12 max-w-md">
              Let's personalise your intelligence feed. This takes 30 seconds.
            </p>

            {/* Get Started button */}
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center justify-center gap-2 w-full max-w-[320px] py-4 bg-[#00b4d8] text-black font-semibold rounded-lg hover:bg-[#00b4d8]/90 transition-all active:scale-95 group"
            >
              Get Started
              <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1" />
            </button>

            <button onClick={handleSkip} className="mt-5 text-[#555555] text-sm hover:text-[#888888] transition-colors">
              Skip setup
            </button>
          </motion.div>
        )}

        {/* ── STEP 2 — Topic selection ── */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 flex flex-col min-h-screen p-6 max-w-4xl mx-auto"
          >
            {/* Back button */}
            <button
              onClick={() => handleBack(1)}
              className="fixed top-6 left-8 flex items-center gap-2 cursor-pointer group"
              style={{ color: '#666666', zIndex: 50 }}
            >
              <ChevronLeft className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-[3px]" />
              <span className="text-sm font-medium tracking-[0.05em] transition-colors duration-150 group-hover:text-white">Back</span>
            </button>

            <div className="flex justify-center mt-2 mb-0">
              <StepIndicator currentStep={2} />
            </div>

            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2 tracking-tight text-white">What do you want to track?</h2>
              <p className="text-[#888888]">Select all topics that interest you. You can change this anytime.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
              {TOPICS.map(topic => {
                const isSelected = selectedTopics.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    onClick={() => toggleTopic(topic.id)}
                    className="relative flex flex-col items-center justify-center p-6 rounded-xl border transition-all duration-150 text-center"
                    style={{
                      background: isSelected ? 'rgba(0,180,216,0.08)' : '#0a0a0a',
                      borderColor: isSelected ? '#00b4d8' : '#1a1a1a',
                      color: isSelected ? '#ffffff' : '#888888',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#333333';
                        (e.currentTarget as HTMLButtonElement).style.color = '#cccccc';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a1a1a';
                        (e.currentTarget as HTMLButtonElement).style.color = '#888888';
                      }
                    }}
                  >
                    {/* Cyan checkmark top-right when selected */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#00b4d8] flex items-center justify-center">
                        <Check className="w-3 h-3 text-black" />
                      </div>
                    )}
                    <div className="mb-3">{topic.icon}</div>
                    <span className="text-sm font-medium">{topic.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto flex flex-col items-center gap-4 pb-8">
              <button
                disabled={selectedTopics.length === 0}
                onClick={() => setCurrentStep(3)}
                className="w-full max-w-xs py-4 font-semibold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 group"
                style={{
                  background: selectedTopics.length > 0 ? '#00b4d8' : '#1a1a1a',
                  color: selectedTopics.length > 0 ? '#000' : '#888888',
                  cursor: selectedTopics.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: selectedTopics.length === 0 ? 0.4 : 1,
                }}
              >
                Continue
                {selectedTopics.length > 0 && (
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1" />
                )}
              </button>
              <button onClick={handleSkip} className="text-[#555555] text-sm hover:text-[#888888] transition-colors">
                Skip
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3 — Expertise level ── */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 flex flex-col min-h-screen p-6 max-w-2xl mx-auto"
          >
            {/* Back button */}
            <button
              onClick={() => handleBack(2)}
              className="fixed top-6 left-8 flex items-center gap-2 cursor-pointer group"
              style={{ color: '#666666', zIndex: 50 }}
            >
              <ChevronLeft className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-[3px]" />
              <span className="text-sm font-medium tracking-[0.05em] transition-colors duration-150 group-hover:text-white">Back</span>
            </button>

            <div className="flex justify-center mt-2 mb-0">
              <StepIndicator currentStep={3} />
            </div>

            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2 tracking-tight text-white">How do you want information presented?</h2>
              <p className="text-[#888888]">This adjusts the depth and complexity of your intelligence reports.</p>
            </div>

            <div className="flex flex-col gap-3 mb-10">
              {EXPERTISE_OPTIONS.map(option => {
                const isSelected = expertiseLevel === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setExpertiseLevel(option.id)}
                    className="flex items-center gap-5 p-5 rounded-xl border transition-all duration-150 text-left w-full"
                    style={{
                      background: isSelected ? 'rgba(0,180,216,0.06)' : '#0a0a0a',
                      borderColor: isSelected ? '#00b4d8' : '#1a1a1a',
                      borderLeftWidth: isSelected ? '4px' : '1px',
                    }}
                  >
                    {/* Icon */}
                    <div style={{ color: isSelected ? '#00b4d8' : '#888888', flexShrink: 0, marginTop: '2px' }}>
                      {option.icon}
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                      <h3 className="text-base font-semibold mb-0.5" style={{ color: isSelected ? '#ffffff' : '#888888' }}>
                        {option.title}
                      </h3>
                      <p className="text-sm text-[#888888] leading-relaxed">{option.description}</p>
                    </div>

                    {/* Radio indicator */}
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150"
                      style={{
                        borderColor: isSelected ? '#00b4d8' : '#555555',
                        background: isSelected ? '#00b4d8' : 'transparent',
                      }}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-black" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto flex flex-col items-center gap-4 pb-8">
              <button
                onClick={handleComplete}
                className="flex items-center justify-center gap-2 w-full max-w-xs py-4 bg-[#00b4d8] text-black font-semibold rounded-lg hover:bg-[#00b4d8]/90 transition-all active:scale-95 group"
              >
                Complete Setup
                <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── COMPLETION ANIMATION ── */}
        {currentStep === 'completion' && (
          <motion.div
            key="completion"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen bg-black"
          >
            {/* Radial glow for completion */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 50% 50%, rgba(0,180,216,0.08) 0%, transparent 60%)' }}
            />

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="relative z-10 flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 mb-8">
                <MLogoMark className="w-full h-full" />
              </div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="text-2xl font-medium tracking-wide text-white"
              >
                Your intelligence feed is ready.
              </motion.p>

              <CompletionBar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useEffect, useState } from 'react';

/**
 * LoadingScreen.tsx
 * 
 * Integration:
 * const [loading, setLoading] = useState(true);
 * {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
 * <Dashboard />
 */

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const brandName = "MONTRIDGE";
  const tagline = "Cut Through the Noise. Find What Matters.";

  useEffect(() => {
    // Total duration is approximately 4.5s - 4.9s based on the sequence
    // We trigger onComplete after the fade-out finishes
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 5000); // 4.9s total + small buffer

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#05050A] overflow-hidden select-none animate-screen-fade-out">
      {/* Subtle radial glow behind the logo */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(0, 180, 216, 0.06) 0%, transparent 60%)'
        }}
      />

      {/* M Lettermark SVG */}
      <div className="relative w-[144px] h-[144px] mb-5">
        <svg 
          viewBox="0 0 80 80" 
          className="w-full h-full"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* The Stroke Path */}
          <path
            d="M 15 65 V 15 L 40 40 L 65 15 V 65"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-stroke-draw"
            style={{
              strokeDasharray: 180,
              strokeDashoffset: 180,
            }}
          />
          {/* The Fill Path */}
          <path
            d="M 15 65 V 15 L 40 40 L 65 15 V 65"
            fill="white"
            className="animate-fill-fade-in opacity-0"
          />
        </svg>
      </div>

      {/* MONTRIDGE Text */}
      <div className="flex mb-3">
        {brandName.split('').map((char, index) => (
          <span
            key={index}
            className="text-white text-[2.4rem] font-semibold tracking-widest opacity-0 animate-letter-fade-in"
            style={{ animationDelay: `${1900 + index * 50}ms` }}
          >
            {char}
          </span>
        ))}
      </div>

      {/* Tagline */}
      <p className="text-[#6B7280] text-[0.75rem] tracking-wide opacity-0 animate-tagline-fade-in">
        {tagline}
      </p>

      <style>{`
        @keyframes stroke-draw {
          0% { stroke-dashoffset: 180; opacity: 0; }
          5% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }

        @keyframes stroke-fade-out {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes fill-fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes letter-fade-in {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes tagline-fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes screen-fade-out {
          0% { opacity: 1; }
          88% { opacity: 1; }
          100% { opacity: 0; }
        }

        .animate-stroke-draw {
          animation: 
            stroke-draw 1200ms ease-in-out 400ms forwards,
            stroke-fade-out 300ms ease 1600ms forwards;
        }

        .animate-fill-fade-in {
          animation: fill-fade-in 300ms ease 1600ms forwards;
        }

        .animate-letter-fade-in {
          animation: letter-fade-in 600ms ease forwards;
        }

        .animate-tagline-fade-in {
          animation: tagline-fade-in 400ms ease 3300ms forwards;
        }

        .animate-screen-fade-out {
          animation: screen-fade-out 4900ms ease-in forwards;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;

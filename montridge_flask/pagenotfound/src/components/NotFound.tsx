import React, { useRef } from 'react';
import { ChevronLeft } from 'lucide-react';

export default function NotFound() {
  const pageRef = useRef<HTMLDivElement>(null);

  const handleBack = () => {
    if (pageRef.current) {
      pageRef.current.style.transition = 'opacity 120ms ease';
      pageRef.current.style.opacity = '0';
    }
    setTimeout(() => { window.location.href = '/dashboard'; }, 120);
  };

  return (
    <div ref={pageRef} className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Radial glow — matches landing page */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(0, 180, 216, 0.06) 0%, transparent 60%)' }}
      />

      {/* Back button */}
      <button
        onClick={handleBack}
        className="fixed top-6 left-8 z-50 flex items-center gap-2 cursor-pointer group"
        style={{ color: '#666666' }}
      >
        <ChevronLeft
          className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-[3px]"
          style={{ transition: 'transform 150ms ease, color 150ms ease' }}
        />
        <span
          className="text-sm font-medium tracking-[0.05em] transition-colors duration-150 group-hover:text-white"
        >
          Return to Feed
        </span>
      </button>

      <div className="relative z-10">
        <h1 className="text-[#00b4d8] text-[10rem] font-bold leading-none select-none">
          404
        </h1>
        <h2 className="text-white text-4xl font-bold mt-4 mb-2">
          Signal Lost
        </h2>
        <p className="text-[#888888] text-lg mb-12 max-w-md">
          This intelligence report doesn't exist or has been removed.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleBack}
            className="px-8 py-4 bg-[#00b4d8] text-black font-bold rounded-xl hover:bg-[#00b4d8]/90 transition-all active:scale-95"
          >
            Return to Feed
          </button>
          <button
            onClick={() => { window.location.href = '/'; }}
            className="px-8 py-4 border-2 border-[#00b4d8] text-[#00b4d8] font-bold rounded-xl hover:bg-[#00b4d8]/10 transition-all active:scale-95"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    </div>
  );
}

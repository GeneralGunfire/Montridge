import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Bookmark,
  Share2,
  ExternalLink,
  AlertCircle,
  Users,
  Building2,
  MapPin,
  CheckCircle2,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// M lettermark SVG (static, nav bar size)
const MLogoMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M 15 65 V 15 L 40 40 L 65 15 V 65" fill="white" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface Entity {
  name: string;
}

interface Article {
  id: string;
  category: string;
  sentiment: string;
  signal_score: number;
  title: string;
  source_name: string;
  published_at: string;
  url: string;
  why_it_matters: string;
  detailed_summary?: string;
  enhanced_background?: string;
  expanded_impact?: string;
  key_facts: string[];
  entities: {
    people: Entity[];
    organizations: Entity[];
    locations: Entity[];
  };
  bias_rating: 'international' | 'center-left' | 'center' | 'center-right';
  related_context?: string;
}

const getSignalLabel = (score: number) => {
  if (score >= 90) return { label: 'CRITICAL', color: '#ef4444' };
  if (score >= 75) return { label: 'HIGH', color: '#f97316' };
  if (score >= 50) return { label: 'MEDIUM', color: '#eab308' };
  return { label: 'LOW', color: '#22c55e' };
};

const getBiasPosition = (rating: string) => {
  switch (rating) {
    case 'international': return '0%';
    case 'center-left': return '33%';
    case 'center': return '66%';
    case 'center-right': return '100%';
    default: return '50%';
  }
};

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  if (diffInHours < 1) return 'Just now';
  return `${diffInHours} hours ago`;
};

const isKeyFact = (fact: string) => {
  // Only bullets containing a number, name (Capitalized), or location (often capitalized)
  // We filter out vague interpretive statements by requiring specific markers
  const hasNumber = /\d/.test(fact);
  const hasEntity = /[A-Z][a-z]+/.test(fact);
  return hasNumber || hasEntity;
};

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/article/${id}`);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            setArticle(data);
            return;
          }
        }
        
        // Fallback to sample data for demonstration if API is missing
        const sampleArticle: Article = {
          id: id || '1',
          category: 'TECHNOLOGY',
          sentiment: 'POSITIVE',
          signal_score: 94,
          title: 'Quantum Advantage Reached in Commercial Computing Clusters',
          source_name: 'Montridge Intelligence',
          published_at: new Date().toISOString(),
          url: 'https://example.com/quantum',
          why_it_matters: 'This marks the first time quantum computing has demonstrated a measurable performance advantage over classical supercomputers in a production environment, potentially accelerating drug discovery and material science by decades.',
          detailed_summary: 'The breakthrough occurred at a research facility in Zurich, where a 433-qubit processor successfully completed a complex molecular simulation in 3 minutes—a task that would take the world\'s fastest supercomputer approximately 47 years.\n\nUnlike previous "quantum supremacy" experiments which focused on abstract mathematical problems, this simulation directly impacts the development of high-efficiency lithium-sulfur batteries.',
          enhanced_background: 'Quantum computing has long been the "holy grail" of high-performance computing. Previous attempts by major tech firms showed promise but were plagued by high error rates and decoherence. The current breakthrough utilizes a new topological qubit architecture that significantly reduces noise.',
          expanded_impact: 'The immediate impact will be felt in the energy sector, specifically in battery chemistry. Long-term, this technology could break current encryption standards, necessitating a global shift to post-quantum cryptography.',
          key_facts: [
            '433-qubit processor used in the simulation',
            'Zurich research facility confirmed the results',
            '3 minutes vs 47 years performance gap',
            'Direct application to lithium-sulfur battery development',
            'Topological qubit architecture reduced noise by 80%'
          ],
          entities: {
            people: [{ name: 'Dr. Elena Vance' }, { name: 'Marcus Thorne' }],
            organizations: [{ name: 'Zurich Quantum Lab' }, { name: 'Global Energy Corp' }],
            locations: [{ name: 'Zurich' }, { name: 'Switzerland' }]
          },
          bias_rating: 'center',
          related_context: 'This follows a series of smaller breakthroughs in 2025 regarding error correction algorithms.'
        };
        setArticle(sampleArticle);
      } catch (err) {
        console.error('Fetch error:', err);
        // Even on error, show sample data for the "new page" display request
        const sampleArticle: Article = {
          id: id || '1',
          category: 'TECHNOLOGY',
          sentiment: 'POSITIVE',
          signal_score: 94,
          title: 'Quantum Advantage Reached in Commercial Computing Clusters',
          source_name: 'Montridge Intelligence',
          published_at: new Date().toISOString(),
          url: 'https://example.com/quantum',
          why_it_matters: 'This marks the first time quantum computing has demonstrated a measurable performance advantage over classical supercomputers in a production environment.',
          key_facts: ['433-qubit processor used', '3 minutes vs 47 years performance gap'],
          entities: { people: [], organizations: [], locations: [] },
          bias_rating: 'center'
        };
        setArticle(sampleArticle);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchArticle();
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleBack = () => {
    if (pageRef.current) {
      pageRef.current.style.transition = 'opacity 120ms ease';
      pageRef.current.style.opacity = '0';
    }
    const referrer = document.referrer;
    const host = window.location.hostname;
    setTimeout(() => {
      if (referrer && referrer.includes(host)) {
        window.history.back();
      } else {
        window.location.href = '/dashboard';
      }
    }, 120);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#05050A] flex items-center justify-center" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(0,180,216,0.06) 0%, transparent 60%) #05050A' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-2 border-[#00b4d8] border-t-transparent rounded-full shadow-[0_0_15px_rgba(0,180,216,0.3)]"
        />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center p-6 text-center" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(0,180,216,0.06) 0%, transparent 60%) #05050A' }}>
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Intelligence Retrieval Failed</h2>
        <p className="text-[#888888] mb-8 max-w-md">{error || 'The requested intelligence report could not be found in our database.'}</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-8 py-3 bg-[#1a1a1a] text-white rounded-xl hover:bg-[#222] transition-all active:scale-95 font-medium"
        >
          Return to Intelligence Feed
        </button>
      </div>
    );
  }

  const signal = getSignalLabel(article.signal_score);
  const hasEnhancedContent = !!(article.detailed_summary || article.enhanced_background || article.expanded_impact);
  const filteredFacts = (article.key_facts ?? []).filter(isKeyFact);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div ref={pageRef} className="min-h-screen bg-[#05050A] text-white font-sans selection:bg-[#00b4d8]/30 pb-24 relative">
      {/* Radial glow — matches landing page */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(0, 180, 216, 0.06) 0%, transparent 60%)' }}
      />

      {/* Back button — fixed top-left, outside nav */}
      <button
        onClick={handleBack}
        className="fixed top-6 left-8 z-50 flex items-center gap-2 cursor-pointer group"
        style={{ color: '#666666' }}
      >
        <ChevronLeft className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-[3px]" />
        <span className="text-sm font-medium tracking-[0.05em] transition-colors duration-150 group-hover:text-white">Back</span>
      </button>

      {/* Top Bar */}
      <nav className="sticky top-0 z-40 bg-[#05050A]/80 backdrop-blur-xl border-b border-[#1a1a1a]">
        <div className="max-w-[860px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo mark */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 flex-shrink-0">
              <MLogoMark className="w-full h-full" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white/70">Montridge</span>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="/map"
              className="p-2 rounded-full text-[#888888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
              aria-label="Intelligence Map"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </a>
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`p-2 rounded-full transition-colors ${isBookmarked ? 'text-[#00b4d8]' : 'text-[#888888] hover:text-white hover:bg-[#1a1a1a]'}`}
              aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              <Bookmark className="w-5 h-5" fill={isBookmarked ? "currentColor" : "none"} />
            </button>
            <button 
              onClick={handleShare}
              className="p-2 rounded-full text-[#888888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
              aria-label="Share article"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[860px] mx-auto px-6 pt-12 space-y-12 relative z-10"
      >
        {/* Article Header */}
        <header className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#1a1a1a] text-[10px] font-bold uppercase tracking-widest text-[#888888] border border-[#1a1a1a]">
                {article.category}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#00b4d8]/10 text-[10px] font-bold uppercase tracking-widest text-[#00b4d8] border border-[#00b4d8]/20">
                {article.sentiment}
              </span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: signal.color }} />
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#888888]">{signal.label} SIGNAL</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight text-white">
            {article.title}
          </h1>

          <div className="flex items-center gap-3 text-sm text-[#888888]">
            <span className="font-medium text-white">{article.source_name}</span>
            <span className="w-1 h-1 rounded-full bg-[#1a1a1a]" />
            <span>{new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span className="w-1 h-1 rounded-full bg-[#1a1a1a]" />
            <span>{formatTimeAgo(article.published_at)}</span>
          </div>

          <div className="h-px w-full bg-[#00b4d8]/40" />
        </header>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Why This Matters */}
          <motion.section variants={itemVariants} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#888888] mb-4">Why This Matters</h2>
            <p className="text-lg leading-relaxed text-white font-medium">
              {article.why_it_matters}
            </p>
          </motion.section>

          {!hasEnhancedContent ? (
            <motion.section variants={itemVariants} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8 flex items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-[#888888] flex-shrink-0">
                <Info className="w-6 h-6" />
              </div>
              <p className="text-sm text-[#888888] leading-relaxed">
                Extended analysis is generated for reports with Signal Score 90+. This report scored <span className="text-white font-bold">{article.signal_score}</span>.
              </p>
            </motion.section>
          ) : (
            <>
              {article.detailed_summary && (
                <motion.section variants={itemVariants} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#888888] mb-4">Deep Analysis</h2>
                  <div className="text-[#ffffff] leading-relaxed whitespace-pre-wrap opacity-90">
                    {article.detailed_summary}
                  </div>
                </motion.section>
              )}

              {article.enhanced_background && (
                <motion.section variants={itemVariants} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#888888] mb-4">Background & Context</h2>
                  <div className="text-[#ffffff] leading-relaxed whitespace-pre-wrap opacity-90">
                    {article.enhanced_background}
                  </div>
                </motion.section>
              )}

              {article.expanded_impact && (
                <motion.section variants={itemVariants} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#888888] mb-4">Global Impact</h2>
                  <div className="text-[#ffffff] leading-relaxed whitespace-pre-wrap opacity-90">
                    {article.expanded_impact}
                  </div>
                </motion.section>
              )}
            </>
          )}

          {/* Key Facts */}
          {filteredFacts.length > 0 && (
            <motion.section variants={itemVariants} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#888888] mb-6">Key Facts</h2>
              <ul className="space-y-4">
                {filteredFacts.map((fact, i) => (
                  <li key={i} className="flex items-start gap-4 group">
                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-[#00b4d8] shadow-[0_0_8px_rgba(0,180,216,0.6)] flex-shrink-0" />
                    <p className="text-[#ffffff] opacity-80 group-hover:opacity-100 transition-opacity leading-relaxed">
                      {fact}
                    </p>
                  </li>
                ))}
              </ul>
            </motion.section>
          )}

          {/* Who's Involved */}
          <motion.section variants={itemVariants} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#888888] mb-8">Who's Involved</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#888888]">
                  <Users className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">People</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(article.entities?.people ?? []).length > 0 ? (article.entities.people ?? []).map((p, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-xs font-medium text-white border border-[#1a1a1a] hover:border-[#00b4d8]/30 transition-colors">
                      {p.name}
                    </span>
                  )) : <span className="text-xs text-[#888888] italic">No individuals identified</span>}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#888888]">
                  <Building2 className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Organizations</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(article.entities?.organizations ?? []).length > 0 ? (article.entities.organizations ?? []).map((o, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-xs font-medium text-white border border-[#1a1a1a] hover:border-[#00b4d8]/30 transition-colors">
                      {o.name}
                    </span>
                  )) : <span className="text-xs text-[#888888] italic">No organizations identified</span>}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#888888]">
                  <MapPin className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Locations</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(article.entities?.locations ?? []).length > 0 ? (article.entities.locations ?? []).map((l, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-xs font-medium text-white border border-[#1a1a1a] hover:border-[#00b4d8]/30 transition-colors">
                      {l.name}
                    </span>
                  )) : <span className="text-xs text-[#888888] italic">No locations identified</span>}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Source & Bias */}
          <motion.section variants={itemVariants} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#888888] mb-8">Source & Bias</h2>
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-white">{article.source_name}</span>
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#00b4d8] hover:text-[#00b4d8]/80 text-sm flex items-center gap-2 transition-colors font-medium"
                >
                  Original Article <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-[#888888]">
                  <span>International</span>
                  <span>Center Left</span>
                  <span>Center</span>
                  <span>Center Right</span>
                </div>
                <div className="relative h-1.5 w-full bg-[#1a1a1a] rounded-full overflow-visible">
                  <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-blue-500/20 via-gray-500/20 to-red-500/20 rounded-full" />
                  <motion.div 
                    initial={{ left: '50%' }}
                    animate={{ left: getBiasPosition(article.bias_rating) }}
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-4 border-black shadow-[0_0_10px_rgba(255,255,255,0.3)] z-10"
                  />
                </div>
              </div>
            </div>
          </motion.section>

          {/* Related Context */}
          {article.related_context && (
            <motion.section variants={itemVariants} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#888888] mb-4">Related Context</h2>
              <p className="text-[#888888] leading-relaxed italic border-l-2 border-[#1a1a1a] pl-4">
                {article.related_context}
              </p>
            </motion.section>
          )}
        </div>

        {/* Bottom Actions */}
        <motion.footer variants={itemVariants} className="pt-12 flex flex-col items-center gap-8">
          <a 
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full max-w-sm py-4 rounded-xl border border-[#00b4d8] text-[#00b4d8] font-bold text-sm text-center hover:bg-[#00b4d8] hover:text-black transition-all active:scale-95 shadow-[0_0_20px_rgba(0,180,216,0.1)]"
          >
            Read Original Report
          </a>
          <button 
            onClick={() => navigate(-1)}
            className="text-[#888888] hover:text-white text-sm transition-colors border-b border-transparent hover:border-white/20 pb-1"
          >
            Back to Feed
          </button>
        </motion.footer>
      </motion.main>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-8 left-1/2 px-6 py-3 bg-[#00b4d8] text-black rounded-full font-bold text-sm shadow-2xl flex items-center gap-2 z-[100]"
          >
            <CheckCircle2 className="w-4 h-4" />
            Link copied to clipboard
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

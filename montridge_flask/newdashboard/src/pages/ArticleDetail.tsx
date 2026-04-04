import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ExternalLink,
  Calendar,
  Building2,
  MapPin,
  User2,
  AlertCircle,
  Bookmark,
} from 'lucide-react';
import { api } from '../services/api';

// --- Types ---

interface ArticleData {
  id: number;
  title: string;
  summary: string;
  source: string;
  url?: string;
  published_date: string;
  fetched_at?: string;
  category?: string;
  categories?: string[];
  sentiment?: string;
  signal_score?: number;
  source_bias?: string;
  // AI-enriched fields
  why_it_matters?: string;
  detailed_summary?: string;
  enhanced_background?: string;
  expanded_impact?: string;
  related_context?: string;
  key_facts?: string[];
  entities?: {
    people?: string[];
    organizations?: string[];
    places?: string[];
  };
}

// --- Helpers ---

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function signalDotColor(score: number): string {
  if (score >= 80) return '#4ADE80';
  if (score >= 60) return '#EAB308';
  if (score >= 40) return '#F97316';
  return '#F87171';
}

function signalLabel(score: number): string {
  if (score >= 90) return 'Critical';
  if (score >= 80) return 'High';
  if (score >= 60) return 'Medium';
  if (score >= 40) return 'Low';
  return 'Minimal';
}

function biasFriendlyLabel(bias: string | undefined): string {
  if (!bias) return 'Unknown';
  const map: Record<string, string> = {
    left: 'Left-leaning',
    'center-left': 'Center-left',
    center: 'Center',
    'center-right': 'Center-right',
    right: 'Right-leaning',
    international: 'International perspective',
    scientific: 'Science-focused',
  };
  return map[bias.toLowerCase()] || bias;
}

// --- Sub-components ---

const SkeletonBlock = ({ className }: { className: string }) => (
  <div
    className={`rounded bg-[#1a1a1a] ${className}`}
    style={{
      background:
        'linear-gradient(90deg, #0a0a0a 0%, rgba(255,255,255,0.04) 50%, #0a0a0a 100%)',
      backgroundSize: '400px 100%',
      animation: 'shimmer 1.5s infinite linear',
    }}
  />
);

const SectionBlock = ({
  label,
  children,
  accent = false,
}: {
  label: string;
  children: React.ReactNode;
  accent?: boolean;
}) => (
  <div
    className={`rounded-2xl p-8 border ${
      accent
        ? 'bg-[rgba(0,180,216,0.04)] border-[#00B4D8]/20'
        : 'bg-[#0a0a0a] border-[#1a1a1a]'
    }`}
  >
    <p
      className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 ${
        accent ? 'text-[#00B4D8]' : 'text-[#94A3B8]'
      }`}
    >
      {label}
    </p>
    {children}
  </div>
);

const TagChip = ({ label, icon }: { label: string; icon?: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1a1a1a] border border-[#1a1a1a] rounded-lg text-[11px] font-medium text-[#94A3B8] hover:text-white hover:border-[#00B4D8]/30 transition-all">
    {icon}
    {label}
  </span>
);

// --- Main ArticleDetail ---

const ArticleDetail = ({ id }: { id: number }) => {
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showSignInTip, setShowSignInTip] = useState(false);
  const isAuthenticated = !!localStorage.getItem('jwt_token');

  useEffect(() => {
    if (!id) {
      setError('Invalid article ID.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .getArticle(id)
      .then((data) => {
        setArticle(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Unable to load this report. The article may have been removed or is unavailable.');
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.getBookmarks()
      .then((data: Array<{ id: number }>) => {
        if (Array.isArray(data)) {
          setIsBookmarked(data.some((a) => a.id === id));
        }
      })
      .catch(() => {});
  }, [id, isAuthenticated]);

  const handleBookmark = () => {
    if (!isAuthenticated) {
      setShowSignInTip(true);
      setTimeout(() => setShowSignInTip(false), 2000);
      return;
    }
    if (isBookmarked) {
      api.removeBookmark(id).catch(() => {});
      setIsBookmarked(false);
    } else {
      api.addBookmark(id).catch(() => {});
      setIsBookmarked(true);
    }
  };

  const goBack = () => {
    window.location.href = '/dashboard';
  };

  // --- Loading state ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] text-white">
        <style>{`
          @keyframes shimmer {
            0% { background-position: -400px 0; }
            100% { background-position: 400px 0; }
          }
        `}</style>
        <nav className="sticky top-0 z-50 bg-[#000000]/80 backdrop-blur-xl border-b border-[#1a1a1a] h-14 px-6 flex items-center">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </nav>
        <main className="max-w-3xl mx-auto px-6 py-16 space-y-8">
          <SkeletonBlock className="h-10 w-3/4" />
          <SkeletonBlock className="h-6 w-1/2" />
          <div className="space-y-3 pt-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-5 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // --- Error state ---
  if (error || !article) {
    return (
      <div className="min-h-screen bg-[#000000] text-white">
        <nav className="sticky top-0 z-50 bg-[#000000]/80 backdrop-blur-xl border-b border-[#1a1a1a] h-14 px-6 flex items-center">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </nav>
        <main className="max-w-3xl mx-auto px-6 py-24 flex flex-col items-center gap-6">
          <AlertCircle className="w-12 h-12 text-[#F87171]" />
          <p className="text-[#94A3B8] text-center max-w-md">{error}</p>
          <button
            onClick={goBack}
            className="px-6 py-2.5 border border-[#00B4D8] text-[#00B4D8] rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-[rgba(0,180,216,0.08)] transition-all"
          >
            Return to Dashboard
          </button>
        </main>
      </div>
    );
  }

  const score = article.signal_score || 0;
  const hasDeepAnalysis =
    article.detailed_summary || article.enhanced_background || article.expanded_impact;
  const categories = article.categories || (article.category ? [article.category] : []);
  const entities = article.entities || {};
  // Normalise key_facts: accept array or string, then filter to only factual bullets
  const keyFacts: string[] = (() => {
    const raw = article.key_facts;
    let items: string[] = [];
    if (!raw) return items;
    if (Array.isArray(raw)) {
      items = raw.map((f) => String(f).trim()).filter(Boolean);
    } else if (typeof raw === 'string') {
      // Split on newlines first, fall back to period-splitting
      const byLine = (raw as string).split('\n').map((s) => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
      items = byLine.length > 1 ? byLine : (raw as string).split(/\.\s+/).map((s) => s.trim()).filter(Boolean);
    }
    // Keep only bullets that contain at least one number, proper name (capitalised word), or location indicator
    return items.filter((f) =>
      /\d/.test(f) ||                          // contains a number
      /[A-Z][a-z]{1,}/.test(f) ||             // contains a capitalised word (name/place)
      /\b(percent|billion|million|trillion|km|miles|tonnes|barrels)\b/i.test(f)
    );
  })();

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#000000]/90 backdrop-blur-xl border-b border-[#1a1a1a] h-14 px-6 flex items-center justify-between">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: signalDotColor(score) }} />
            <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.3em]">
              Signal {signalLabel(score)} — {score}/100
            </span>
          </div>
          <div className="relative">
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-lg transition-all ${
                isBookmarked ? 'text-[#00B4D8]' : 'text-[#94A3B8] hover:text-[#00B4D8]'
              }`}
              title={isAuthenticated ? (isBookmarked ? 'Remove bookmark' : 'Save article') : 'Sign in to save articles'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            {showSignInTip && (
              <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-[#1a1a1a] border border-[#2E3A4A] rounded-lg text-[10px] font-bold text-white whitespace-nowrap shadow-xl z-20">
                Sign in to save articles
                <div className="absolute bottom-full right-3 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-[#1a1a1a]" />
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <header className="space-y-6">
          {/* Category + Sentiment badges */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat}
                className="px-3 py-1 bg-[#1a1a1a] text-[#94A3B8] text-[9px] font-bold uppercase tracking-[0.15em] rounded-lg"
              >
                {cat}
              </span>
            ))}
            {article.sentiment && (
              <span
                className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] border ${
                  article.sentiment.toLowerCase() === 'positive'
                    ? 'text-[#4ADE80] bg-[rgba(34,197,94,0.12)] border-[rgba(34,197,94,0.2)]'
                    : article.sentiment.toLowerCase() === 'negative'
                    ? 'text-[#F87171] bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.2)]'
                    : 'text-[#94A3B8] bg-[rgba(148,163,184,0.08)] border-[rgba(148,163,184,0.1)]'
                }`}
              >
                {article.sentiment}
              </span>
            )}
            {/* Signal score badge */}
            <span
              className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border"
              style={{
                color: signalDotColor(score),
                backgroundColor: `${signalDotColor(score)}18`,
                borderColor: `${signalDotColor(score)}40`,
              }}
            >
              Signal {score} — {signalLabel(score)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-[1.15] tracking-tight">
            {article.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#94A3B8] font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[10px] font-bold">
                {(article.source || '?').charAt(0)}
              </div>
              <span className="font-bold text-white uppercase tracking-wider">{article.source}</span>
            </div>
            {article.published_date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(article.published_date)}
              </div>
            )}
            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#00B4D8] hover:text-white transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Original Source
              </a>
            )}
          </div>
        </header>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-[#00B4D8]/20 via-[#00B4D8]/10 to-transparent" />

        {/* Why This Matters — always first, always prominent */}
        {article.why_it_matters && (
          <SectionBlock label="Why This Matters" accent>
            <p className="text-lg text-white leading-[1.75] font-medium">
              {article.why_it_matters}
            </p>
          </SectionBlock>
        )}

        {/* Deep Analysis */}
        {article.detailed_summary ? (
          <SectionBlock label="Deep Analysis">
            <p className="text-[15px] text-[#94A3B8] leading-[1.85] font-medium whitespace-pre-line">
              {article.detailed_summary}
            </p>
          </SectionBlock>
        ) : !hasDeepAnalysis ? (
          <div className="rounded-2xl p-8 border border-[#1a1a1a] bg-[#0a0a0a]">
            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em] mb-4">
              Deep Analysis
            </p>
            <p className="text-[13px] text-[#94A3B8] italic leading-relaxed">
              Full deep analysis is available for critical stories (signal score 90+). This story
              scored {score}/100.
            </p>
          </div>
        ) : null}

        {/* Background & Context */}
        {article.enhanced_background && (
          <SectionBlock label="Background & Context">
            <p className="text-[15px] text-[#94A3B8] leading-[1.85] font-medium whitespace-pre-line">
              {article.enhanced_background}
            </p>
          </SectionBlock>
        )}

        {/* Global Impact */}
        {article.expanded_impact && (
          <SectionBlock label="Global Impact">
            <p className="text-[15px] text-[#94A3B8] leading-[1.85] font-medium whitespace-pre-line">
              {article.expanded_impact}
            </p>
          </SectionBlock>
        )}

        {/* Key Facts */}
        {keyFacts.length > 0 && (
          <SectionBlock label="Key Facts">
            <ul className="space-y-3">
              {keyFacts.map((fact, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] mt-2 flex-shrink-0" />
                  <p className="text-[14px] text-[#94A3B8] leading-relaxed">{fact}</p>
                </li>
              ))}
            </ul>
          </SectionBlock>
        )}

        {/* Who's Involved */}
        {(entities.people?.length ||
          entities.organizations?.length ||
          entities.places?.length) ? (
          <SectionBlock label="Who's Involved">
            <div className="space-y-5">
              {entities.people && entities.people.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-[#94A3B8]/60 uppercase tracking-[0.25em] mb-3">
                    People
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {entities.people.map((p) => (
                      <TagChip key={p} label={p} icon={<User2 className="w-3 h-3" />} />
                    ))}
                  </div>
                </div>
              )}
              {entities.organizations && entities.organizations.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-[#94A3B8]/60 uppercase tracking-[0.25em] mb-3">
                    Organizations
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {entities.organizations.map((o) => (
                      <TagChip key={o} label={o} icon={<Building2 className="w-3 h-3" />} />
                    ))}
                  </div>
                </div>
              )}
              {entities.places && entities.places.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-[#94A3B8]/60 uppercase tracking-[0.25em] mb-3">
                    Locations
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {entities.places.map((pl) => (
                      <TagChip key={pl} label={pl} icon={<MapPin className="w-3 h-3" />} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionBlock>
        ) : null}

        {/* Source & Bias */}
        <SectionBlock label="Source & Bias Assessment">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-base">{article.source}</p>
              <p className="text-[#94A3B8] text-sm mt-1">
                Editorial bias:{' '}
                <span className="text-white font-medium">
                  {biasFriendlyLabel(article.source_bias)}
                </span>
              </p>
            </div>
            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 border border-[#1a1a1a] rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] hover:text-[#00B4D8] hover:border-[#00B4D8]/30 transition-all"
              >
                <ExternalLink className="w-3 h-3" /> View Original
              </a>
            )}
          </div>
        </SectionBlock>

        {/* Related Context */}
        {article.related_context && (
          <SectionBlock label="Related Context">
            <p className="text-[14px] text-[#94A3B8] leading-[1.85] font-medium whitespace-pre-line">
              {article.related_context}
            </p>
          </SectionBlock>
        )}

        {/* Back button at bottom */}
        <div className="pt-8 pb-4">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors text-sm font-medium group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Intelligence Dashboard
          </button>
        </div>
      </main>
    </div>
  );
};

export default ArticleDetail;

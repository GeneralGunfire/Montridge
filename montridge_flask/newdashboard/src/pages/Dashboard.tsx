import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Bookmark,
  TrendingUp,
  LineChart as LineChartIcon,
  Globe,
  BarChart3,
  LogOut,
  Newspaper,
  Zap,
  Shield,
  HeartPulse,
  ArrowRight,
  User,
  Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTrendingTopics, useDailyBrief, useConflicts } from '../hooks/useArticles';
import { api } from '../services/api';

// --- Types ---

type View = 'Normal' | 'Quick Insights' | 'Trending Topics' | 'Daily Debrief' | 'Bookmarks';

interface Article {
  id: number;
  title: string;
  summary: string;
  why_it_matters?: string;
  source: string;
  fetched_at: string;
  published_date: string;
  categories: string[];
  category?: string;
  sentiment: string;
  signal_score: number;
  url?: string;
}

interface MarketItem {
  name: string;
  symbol: string;
  current: number;
  change_percent: number;
  direction: 'up' | 'down';
  sparkline: number[];
}

interface ConflictItem {
  cluster_name: string;
  article_count: number;
  latest_article_id: number;
  status_summary: string;
  last_updated: string;
  signal_score: number;
}

interface Topic {
  name: string;
  count: number;
  trending: boolean;
}

interface TopArticle {
  id: number;
  title: string;
  source: string;
  signal_score: number;
}

interface Brief {
  category: string;
  title: string;
  summary: string;
  why_it_matters?: string;
  article_count: number;
  top_articles?: TopArticle[];
}

// --- Helpers ---

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function signalDotColor(score: number): string {
  if (score >= 80) return '#4ADE80';
  if (score >= 60) return '#EAB308';
  if (score >= 40) return '#F97316';
  return '#F87171';
}

// --- Constants ---

const KNOWN_CATEGORIES = [
  'Politics', 'Business', 'Technology', 'Science',
  'Health', 'Conflicts', 'International', 'Military',
];

const MARKET_NARRATIVES: Record<string, string> = {
  'S&P 500':
    'US equities remain elevated — institutional positioning is bullish heading into earnings season. Monitor Fed commentary for near-term volatility.',
  'WTI Crude Oil':
    'Oil is under pressure from global demand uncertainty. If current trend holds, pump prices may ease within 2–3 weeks.',
  'USD Index':
    'The dollar is holding steady against major pairs — favorable for US importers, a mild headwind for exporters and commodities priced in USD.',
};

// M lettermark SVG (static, nav bar size)
const MLogoMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M 15 65 V 15 L 40 40 L 65 15 V 65" fill="white" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const shimmerCSS = `
@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.skeleton-shimmer {
  background: linear-gradient(90deg, #0a0a0a 0%, rgba(255,255,255,0.04) 50%, #0a0a0a 100%);
  background-size: 400px 100%;
  animation: shimmer 1.5s infinite linear;
}
`;

// --- Skeleton ---

const SkeletonBlock = ({ className }: { className: string }) => (
  <div className={`skeleton-shimmer rounded bg-[#1a1a1a] ${className}`} />
);

// --- Signal Dot ---

const SignalDot = ({ score }: { score: number }) => (
  <div
    className="w-2 h-2 rounded-full flex-shrink-0"
    style={{ backgroundColor: signalDotColor(score) }}
    title={`Signal Score: ${score}/100`}
  />
);

// --- Sentiment Badge ---

const SentimentBadge = ({ sentiment }: { sentiment: string }) => {
  const s = (sentiment || 'neutral').toLowerCase();
  const styles: Record<string, string> = {
    positive: 'text-[#4ADE80] bg-[rgba(34,197,94,0.12)] border-[rgba(34,197,94,0.2)]',
    neutral: 'text-[#94A3B8] bg-[rgba(148,163,184,0.08)] border-[rgba(148,163,184,0.1)]',
    negative: 'text-[#F87171] bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.2)]',
  };
  const dots: Record<string, string> = {
    positive: 'bg-emerald-500',
    negative: 'bg-[#F87171]',
    neutral: 'bg-[#94A3B8]',
  };
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${
        styles[s] || styles.neutral
      }`}
    >
      <div className={`w-1 h-1 rounded-full ${dots[s] || dots.neutral}`} />
      {s}
    </div>
  );
};

// --- Live Bar ---

const LiveBar = ({
  status,
}: {
  status: { last_fetched_at: string | null } | null;
}) => {
  const timeLabel = status?.last_fetched_at
    ? formatRelativeTime(status.last_fetched_at)
    : null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[rgba(20,0,0,0.96)] border-b border-red-900/40 h-8 flex items-center justify-center gap-3 backdrop-blur-sm">
      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      <span className="text-[9px] font-black uppercase tracking-[0.35em] text-red-400">
        Live Intelligence Feed
      </span>
      {timeLabel && (
        <span className="text-[9px] text-red-400/50 font-medium">
          — Last sync: {timeLabel}
        </span>
      )}
    </div>
  );
};

// --- Breaking News Carousel ---

const BreakingNewsCarousel = ({
  stories,
  loading,
}: {
  stories: Article[];
  loading: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') => {
    ref.current?.scrollBy({ left: dir === 'right' ? 500 : -500, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex gap-6 overflow-hidden pb-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[460px] bg-[#0a0a0a] rounded-3xl p-8 border border-[#1a1a1a]"
          >
            <SkeletonBlock className="h-5 w-32 mb-6" />
            <SkeletonBlock className="h-7 w-full mb-2" />
            <SkeletonBlock className="h-7 w-3/4 mb-5" />
            <SkeletonBlock className="h-4 w-full mb-1" />
            <SkeletonBlock className="h-4 w-2/3 mb-8" />
            <SkeletonBlock className="h-4 w-28" />
          </div>
        ))}
      </div>
    );
  }

  if (!stories.length) {
    return (
      <div className="flex items-center justify-center py-10 text-[#94A3B8] text-sm">
        No critical intelligence alerts at this time.
      </div>
    );
  }

  return (
    <div className="relative group/carousel">
      {/* Left arrow */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10 w-10 h-10 bg-[#0a0a0a] border border-[#1a1a1a] rounded-full flex items-center justify-center text-[#94A3B8] hover:text-white hover:border-[#00B4D8] transition-all shadow-xl opacity-0 group-hover/carousel:opacity-100"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div
        ref={ref}
        className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory px-1"
      >
        {stories.map((story, i) => (
          <div key={story.id || i} className="flex-shrink-0 w-[85vw] md:w-[460px] snap-start">
            <div className="group relative h-full bg-[#0a0a0a] rounded-3xl p-8 text-white border border-[#1a1a1a] overflow-hidden shadow-2xl transition-all duration-500 hover:border-[#00B4D8]/20">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[rgba(0,180,216,0.04)] rounded-full blur-3xl group-hover:bg-[rgba(0,180,216,0.10)] transition-colors duration-700" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00B4D8] text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-[#00B4D8]/10">
                    <Zap className="w-3 h-3 fill-current" /> Critical Intelligence
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-1 bg-[#1a1a1a] rounded-lg">
                    <SignalDot score={story.signal_score} />
                    <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">
                      {story.signal_score}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-3 leading-tight tracking-tight group-hover:text-[#00B4D8] transition-colors">
                  {story.title}
                </h3>

                <p className="text-[#94A3B8] text-sm leading-relaxed font-medium line-clamp-2 mb-6">
                  {story.why_it_matters || story.summary || ''}
                </p>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      window.location.href = `/intelligence/${story.id}`;
                    }}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#00B4D8] hover:text-white transition-colors group/btn"
                  >
                    Full Analysis{' '}
                    <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                    {story.source}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10 w-10 h-10 bg-[#0a0a0a] border border-[#1a1a1a] rounded-full flex items-center justify-center text-[#94A3B8] hover:text-white hover:border-[#00B4D8] transition-all shadow-xl opacity-0 group-hover/carousel:opacity-100"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// --- Filter Bar ---

const FilterBar = ({
  search,
  onSearch,
  category,
  onCategory,
  dateRange,
  onDateRange,
  sentiment,
  onSentiment,
}: {
  search: string;
  onSearch: (v: string) => void;
  category: string;
  onCategory: (v: string) => void;
  dateRange: number;
  onDateRange: (v: number) => void;
  sentiment: string;
  onSentiment: (v: string) => void;
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dateOpts = [
    { label: '24H', value: 1 },
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
  ];
  const sentimentOpts: { label: string; value: string; activeColor: string; glowColor: string }[] = [
    { label: 'All', value: '', activeColor: '#00b4d8', glowColor: 'rgba(0,180,216,0.3)' },
    { label: 'Positive', value: 'positive', activeColor: '#22c55e', glowColor: 'rgba(34,197,94,0.3)' },
    { label: 'Neutral', value: 'neutral', activeColor: '#888888', glowColor: 'rgba(136,136,136,0.3)' },
    { label: 'Negative', value: 'negative', activeColor: '#ef4444', glowColor: 'rgba(239,68,68,0.3)' },
  ];

  const selectedCategoryLabel = category || 'All Topics';
  const isFilterActive = search !== '' || category !== '' || dateRange !== 7 || sentiment !== '';
  const activeFilterCount = [search !== '', category !== '', dateRange !== 7, sentiment !== ''].filter(Boolean).length;

  const resetFilters = () => {
    onSearch('');
    onCategory('');
    onDateRange(7);
    onSentiment('');
  };

  return (
    <div
      className="mb-12 rounded-xl border border-[#1a1a1a] p-4 md:p-5"
      style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)' }}
    >
      {/* Main row */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-end">

        {/* Search */}
        <div className="flex-1 flex flex-col gap-1.5">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#444444]">SEARCH</span>
          <div className="relative group flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-[#666666] pointer-events-none flex-shrink-0" />
            <input
              type="text"
              value={search}
              placeholder="Search intelligence database..."
              onChange={(e) => onSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full pl-9 pr-3 py-2.5 bg-transparent text-sm text-white placeholder:text-[#444444] focus:outline-none font-medium transition-all duration-150"
              style={{
                borderBottom: searchFocused ? '1px solid #00b4d8' : '1px solid #2a2a2a',
              }}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 lg:items-end lg:flex-shrink-0">
          {/* Topic dropdown */}
          <div className="flex flex-col gap-1.5" ref={dropdownRef}>
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#444444]">TOPIC</span>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] text-sm text-white font-medium min-w-[140px] transition-all duration-150 hover:border-[#333333]"
              >
                {category && <div className="w-1.5 h-1.5 rounded-full bg-[#00b4d8] flex-shrink-0" />}
                <span className="flex-1 text-left text-[13px]">{selectedCategoryLabel}</span>
                <ChevronDown
                  className="w-3.5 h-3.5 text-[#666666] flex-shrink-0 transition-transform duration-150"
                  style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none' }}
                />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-full left-0 mt-1.5 w-full min-w-[180px] bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl shadow-2xl z-30 overflow-hidden py-1"
                  >
                    {[{ label: 'All Topics', value: '' }, ...KNOWN_CATEGORIES.map(c => ({ label: c, value: c }))].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { onCategory(opt.value); setDropdownOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-white font-medium text-left transition-colors duration-100"
                        style={{ background: category === opt.value ? 'rgba(255,255,255,0.05)' : undefined }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                        onMouseLeave={e => (e.currentTarget.style.background = category === opt.value ? 'rgba(255,255,255,0.05)' : 'transparent')}
                      >
                        {category === opt.value
                          ? <div className="w-1.5 h-1.5 rounded-full bg-[#00b4d8] flex-shrink-0" />
                          : <div className="w-1.5 h-1.5 flex-shrink-0" />
                        }
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Period toggles */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#444444]">PERIOD:</span>
            <div className="flex items-center p-0.5 border border-[#1a1a1a] rounded-lg">
              {dateOpts.map((opt) => {
                const active = dateRange === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onDateRange(opt.value)}
                    className="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-150"
                    style={{
                      background: active ? '#00b4d8' : 'transparent',
                      color: active ? '#fff' : '#666666',
                      boxShadow: active ? '0 0 10px rgba(0,180,216,0.3)' : undefined,
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#cccccc'; }}}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666666'; }}}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sentiment toggles */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#444444]">SENTIMENT:</span>
            <div className="flex items-center p-0.5 border border-[#1a1a1a] rounded-lg">
              {sentimentOpts.map((opt) => {
                const active = sentiment === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onSentiment(opt.value)}
                    className="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-150"
                    style={{
                      background: active ? opt.activeColor : 'transparent',
                      color: active ? '#fff' : '#666666',
                      boxShadow: active ? `0 0 10px ${opt.glowColor}` : undefined,
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#cccccc'; }}}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666666'; }}}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Active filter badge */}
      <AnimatePresence>
        {isFilterActive && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 mt-3 pt-3 border-t border-[#1a1a1a]"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#00b4d8]" />
            <span className="text-[11px] text-[#666666] font-medium">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
            </span>
            <button
              onClick={resetFilters}
              className="text-[11px] text-[#00b4d8] font-semibold hover:text-white transition-colors duration-150 ml-1"
            >
              Reset all
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Article Card ---

const ArticleCard = ({
  article,
  isAuthenticated,
  isBookmarked,
  onBookmark,
}: {
  article: Article;
  isAuthenticated: boolean;
  isBookmarked: boolean;
  onBookmark: (id: number, e: React.MouseEvent) => void;
}) => {
  const [showSignInTip, setShowSignInTip] = useState(false);
  const category = article.category || (article.categories || [])[0] || 'General';
  const timeAgo = formatRelativeTime(article.fetched_at || article.published_date);
  const bodyText = article.why_it_matters || article.summary || '';

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setShowSignInTip(true);
      setTimeout(() => setShowSignInTip(false), 2000);
      return;
    }
    onBookmark(article.id, e);
  };

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 30px 60px -12px rgba(0,0,0,0.4)' }}
      className="group relative bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 cursor-pointer overflow-hidden transition-all duration-300"
      onClick={() => {
        window.location.href = `/intelligence/${article.id}`;
      }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-[rgba(0,180,216,0)] rounded-bl-full -mr-12 -mt-12 transition-all duration-500 group-hover:bg-[rgba(0,180,216,0.04)] group-hover:scale-150" />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <span className="px-2.5 py-1 bg-[#1a1a1a] text-[#94A3B8] text-[9px] font-bold uppercase tracking-[0.15em] rounded-lg">
            {category}
          </span>
          <SentimentBadge sentiment={article.sentiment} />
        </div>

        <h3 className="text-lg font-bold text-white mb-3 leading-[1.25] tracking-tight group-hover:text-[#00B4D8] transition-colors duration-300">
          {article.title}
        </h3>

        {bodyText && (
          <div className="mb-6">
            <p className="text-[10px] font-bold text-[#00B4D8] uppercase tracking-widest mb-1.5">
              Why This Matters
            </p>
            <p className="text-[13px] text-[#94A3B8] line-clamp-3 leading-relaxed font-medium">
              {bodyText}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[10px] font-bold text-[#94A3B8]">
              {(article.source || '?').charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                {article.source}
              </span>
              <span className="text-[9px] font-medium text-[#94A3B8]">{timeAgo}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SignalDot score={article.signal_score || 0} />
            <div className="relative">
              <button
                onClick={handleBookmarkClick}
                className={`p-1.5 rounded-lg transition-all ${
                  isBookmarked ? 'text-[#00B4D8]' : 'text-[#94A3B8] hover:text-[#00B4D8]'
                }`}
                title={isAuthenticated ? (isBookmarked ? 'Remove bookmark' : 'Save article') : 'Sign in to save articles'}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
              {showSignInTip && (
                <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-[#1a1a1a] border border-[#2E3A4A] rounded-lg text-[10px] font-bold text-white whitespace-nowrap shadow-xl z-20">
                  Sign in to save articles
                  <div className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#1a1a1a]" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Market Tooltip ---

const MarketTooltip = ({
  active,
  payload,
  marketName,
}: {
  active?: boolean;
  payload?: any[];
  marketName: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-3 py-2 shadow-xl">
        <p className="text-[9px] text-[#94A3B8] uppercase tracking-widest mb-1">{marketName}</p>
        <p className="text-white font-bold text-sm">{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

// --- Market Chart Card ---

const MarketChartCard = ({ market }: { market: MarketItem }) => {
  const color = market.direction === 'up' ? '#00B4D8' : '#F87171';
  const gradId = `grad-${market.symbol}`;
  const data = market.sparkline.map((v, i) => ({ day: `D${i + 1}`, value: v }));
  const narrative = MARKET_NARRATIVES[market.name] || '';

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-8 rounded-3xl space-y-6 hover:shadow-xl hover:shadow-[#00B4D8]/5 transition-all duration-500 group">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-2">
            {market.name}
          </h4>
          <div className="text-3xl font-bold text-white tracking-tighter">
            {market.current.toLocaleString()}
          </div>
        </div>
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${
            market.direction === 'up'
              ? 'text-[#4ADE80] bg-[rgba(74,222,128,0.08)]'
              : 'text-[#F87171] bg-[rgba(239,68,68,0.08)]'
          }`}
        >
          {market.direction === 'up' ? '↑' : '↓'}{' '}
          {market.direction === 'up' ? '+' : ''}
          {market.change_percent}%
        </div>
      </div>

      <div className="h-36 opacity-80 group-hover:opacity-100 transition-opacity duration-500">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis dataKey="day" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip content={<MarketTooltip marketName={market.name} />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradId})`}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: '#000000', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-4 border-t border-[#1a1a1a]">
        <p className="text-[10px] font-black text-[#00B4D8] uppercase tracking-widest mb-2">
          What This Means
        </p>
        <p className="text-[12px] text-[#94A3B8] leading-relaxed">{narrative}</p>
      </div>
    </div>
  );
};

// --- Quick Insights Section ---

const QuickInsightsSection = ({
  marketData,
  marketLoading,
  conflicts,
  conflictsLoading,
}: {
  marketData: MarketItem[];
  marketLoading: boolean;
  conflicts: ConflictItem[];
  conflictsLoading: boolean;
}) => {
  console.log('conflicts:', conflicts);
  return (
  <div className="space-y-16">
    {/* Market Intelligence */}
    <section>
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-[#0a0a0a] rounded-2xl flex items-center justify-center text-white shadow-xl">
          <LineChartIcon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight uppercase text-white">
            Market Intelligence
          </h2>
          <p className="text-[#94A3B8] text-xs font-medium">
            Real-time volatility and trend analysis
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {marketLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#0a0a0a] border border-[#1a1a1a] p-8 rounded-3xl space-y-6"
            >
              <SkeletonBlock className="h-10 w-40" />
              <SkeletonBlock className="h-36 w-full" />
              <SkeletonBlock className="h-12 w-full" />
            </div>
          ))
        ) : marketData.length === 0 ? (
          <div className="col-span-3 flex items-center justify-center py-16 text-[#94A3B8] text-sm">
            Market data unavailable.
          </div>
        ) : (
          marketData.map((m) => <MarketChartCard key={m.name} market={m} />)
        )}
      </div>
    </section>

    {/* Active Conflicts */}
    <section>
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-[rgba(239,68,68,0.15)] rounded-2xl flex items-center justify-center text-[#F87171] shadow-xl">
          <Globe className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight uppercase text-white">
            Active Conflicts
          </h2>
          <p className="text-[#94A3B8] text-xs font-medium">
            High-signal geopolitical friction points — last 7 days
          </p>
        </div>
      </div>

      {conflictsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-[#0a0a0a] border border-[#1a1a1a] p-8 rounded-[2rem]">
              <SkeletonBlock className="h-5 w-24 mb-3" />
              <SkeletonBlock className="h-7 w-3/4 mb-4" />
              <SkeletonBlock className="h-4 w-full mb-2" />
              <SkeletonBlock className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : conflicts.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-[#94A3B8] text-sm">
          No active conflicts data
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(() => { console.log('[ConflictCards] rendering', conflicts.length, 'conflicts:', JSON.stringify(conflicts.map(c => ({ cluster_name: c.cluster_name, article_count: c.article_count, status_summary: c.status_summary, latest_article_id: c.latest_article_id, last_updated: c.last_updated })))); return null; })()}
          {conflicts.map((conflict) => {
            const bodyText = conflict.status_summary && conflict.status_summary.trim()
              ? conflict.status_summary
              : `${conflict.cluster_name} — ${conflict.article_count} article${conflict.article_count !== 1 ? 's' : ''} tracked in the last 7 days.`;
            return (
            <div
              key={conflict.cluster_name}
              className="group relative bg-[#0a0a0a] border border-[#1a1a1a] p-8 rounded-[2rem] overflow-hidden hover:border-red-900/40 hover:shadow-xl transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[rgba(239,68,68,0.02)] rounded-bl-[4rem] -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-110" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg text-[9px] font-black text-[#F87171] uppercase tracking-[0.2em]">
                    Active
                  </div>
                  <div className="flex items-center gap-2">
                    <SignalDot score={conflict.signal_score ?? 0} />
                    <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-widest">
                      {conflict.last_updated}
                    </span>
                  </div>
                </div>

                <h4 className="text-xl font-bold text-white mb-1 tracking-tight leading-tight">
                  {conflict.cluster_name}
                </h4>
                <p className="text-[9px] font-bold text-[#94A3B8]/60 uppercase tracking-widest mb-4">
                  {conflict.article_count} reports in the last 7 days
                </p>

                <p className="text-sm text-[#94A3B8] leading-relaxed font-medium mb-6 line-clamp-3">
                  {bodyText}
                </p>

                <div className="flex items-center justify-end pt-4 border-t border-[#1a1a1a]">
                  <a
                    href={`/intelligence/${conflict.latest_article_id}`}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#00B4D8] hover:text-white transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Read Full Report <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </section>
  </div>
  );
};

// --- Trending Topics Section ---

const TrendingTopicsSection = ({
  topics,
  loading,
  onTopicClick,
}: {
  topics: Topic[];
  loading: boolean;
  onTopicClick: (topic: string) => void;
}) => (
  <div className="space-y-12">
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 bg-[#0a0a0a] rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl">
        <TrendingUp className="w-7 h-7" />
      </div>
      <div>
        <h2 className="text-3xl font-bold tracking-tight uppercase text-white">
          Trending Intelligence
        </h2>
        <p className="text-[#94A3B8] text-sm font-medium mt-1">
          High-velocity topics — last 24 hours
        </p>
      </div>
    </div>

    {loading ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-[2rem] p-10">
            <SkeletonBlock className="h-5 w-20 mb-10" />
            <SkeletonBlock className="h-8 w-32 mb-3" />
            <SkeletonBlock className="h-4 w-24" />
          </div>
        ))}
      </div>
    ) : topics.length === 0 ? (
      <div className="flex items-center justify-center py-16 text-[#94A3B8] text-sm">
        No trending topics detected in the last 24 hours.
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {topics.slice(0, 10).map((topic, idx) => (
          <motion.button
            key={topic.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onTopicClick(topic.name)}
            className="group relative p-10 bg-[#0a0a0a] border border-[#1a1a1a] rounded-[2rem] hover:border-[#00B4D8]/30 hover:shadow-2xl transition-all duration-500 text-left overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-8 text-[100px] font-black text-[#1a1a1a] opacity-40 group-hover:opacity-60 transition-opacity select-none">
              {idx + 1}
            </div>
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="px-3 py-1 bg-[#0a0a0a] rounded-lg text-[10px] font-black text-[#94A3B8] uppercase tracking-widest border border-[#1a1a1a]">
                {topic.count} Reports
              </div>
              {topic.trending && (
                <div className="w-9 h-9 bg-[rgba(0,180,216,0.08)] rounded-xl flex items-center justify-center text-[#00B4D8] border border-[rgba(0,180,216,0.2)]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              )}
            </div>
            <div className="relative z-10">
              <h4 className="text-2xl font-bold text-white group-hover:text-[#00B4D8] transition-colors mb-3 tracking-tight">
                #{topic.name}
              </h4>
              <div className="flex items-center gap-2 text-[10px] font-black text-[#00B4D8] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                Filter Feed <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    )}
  </div>
);

// --- Daily Debrief Section ---

const DailyDebriefSection = ({
  briefs,
  loading,
  isYesterday,
}: {
  briefs: Brief[];
  loading: boolean;
  isYesterday: boolean;
}) => {
  const [expandedIndices, setExpandedIndices] = useState<number[]>([0]);

  const toggle = (idx: number) =>
    setExpandedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );

  const getIcon = (category: string) => {
    const c = (category || '').toLowerCase();
    if (c.includes('politic')) return <Shield className="w-5 h-5" />;
    if (c.includes('business') || c.includes('econ')) return <Zap className="w-5 h-5" />;
    if (c.includes('tech')) return <Newspaper className="w-5 h-5" />;
    if (c.includes('conflict') || c.includes('military')) return <Globe className="w-5 h-5" />;
    return <HeartPulse className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#0a0a0a] rounded-[2rem] border border-[#1a1a1a] px-10 py-8">
            <div className="flex items-center gap-8">
              <SkeletonBlock className="w-12 h-12 rounded-2xl flex-shrink-0" />
              <SkeletonBlock className="h-7 w-64" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-[#00B4D8] rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-[#00B4D8]/20">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight uppercase text-white">
              Intelligence Debrief
            </h2>
            <p className="text-[#94A3B8] text-sm font-medium mt-1">
              {isYesterday
                ? "Yesterday's Briefing — no critical reports filed today"
                : 'Strategic synthesis — last 24-hour cycle'}
            </p>
          </div>
        </div>
        {isYesterday && (
          <div className="px-4 py-2 bg-[rgba(234,179,8,0.1)] border border-[rgba(234,179,8,0.2)] rounded-xl text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">
            Yesterday's Briefing
          </div>
        )}
      </div>

      {briefs.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-[#94A3B8] text-sm">
          No reports filed in this cycle.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {briefs.map((brief, idx) => {
            const isExpanded = expandedIndices.includes(idx);
            return (
              <motion.div
                key={brief.category || idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={`bg-[#0a0a0a] rounded-[2rem] border transition-all duration-500 ${
                  isExpanded
                    ? 'border-[#00B4D8]/30 shadow-xl shadow-[#00B4D8]/5'
                    : 'border-[#1a1a1a]'
                } overflow-hidden`}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full px-10 py-7 flex items-center justify-between text-left hover:bg-[rgba(0,180,216,0.03)] transition-colors"
                >
                  <div className="flex items-center gap-6">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        isExpanded
                          ? 'bg-[#00B4D8] text-white'
                          : 'bg-[#1a1a1a] text-[#94A3B8]'
                      }`}
                    >
                      {getIcon(brief.category)}
                    </div>
                    <div>
                      <h3
                        className={`text-xl font-bold tracking-tight transition-colors ${
                          isExpanded ? 'text-[#00B4D8]' : 'text-white'
                        }`}
                      >
                        {brief.category}
                      </h3>
                      <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mt-0.5">
                        {brief.article_count} verified reports
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${
                      isExpanded
                        ? 'bg-[rgba(0,180,216,0.1)] border-[rgba(0,180,216,0.2)] text-[#00B4D8] rotate-180'
                        : 'bg-[#0a0a0a] border-[#1a1a1a] text-[#94A3B8]'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                    >
                      <div className="px-10 pb-10 pt-2">
                        <div className="h-px bg-gradient-to-r from-[#00B4D8]/20 via-[#00B4D8]/5 to-transparent mb-8" />
                        {(brief.why_it_matters || brief.summary) && (
                          <p className="text-base text-[#94A3B8] leading-[1.8] mb-8 font-medium max-w-3xl">
                            {brief.why_it_matters || brief.summary}
                          </p>
                        )}
                        {brief.top_articles && brief.top_articles.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.3em] mb-3">
                              Top Verified Reports
                            </p>
                            {brief.top_articles.map((a) => (
                              <a
                                key={a.id}
                                href={`/intelligence/${a.id}`}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[rgba(0,180,216,0.05)] transition-colors group/link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <SignalDot score={a.signal_score || 0} />
                                <span className="text-sm text-[#94A3B8] group-hover/link:text-white transition-colors line-clamp-1 font-medium flex-1">
                                  {a.title}
                                </span>
                                <ChevronRight className="w-3 h-3 text-[#94A3B8] flex-shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Main Dashboard ---

const Dashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('Normal');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [locationBanner, setLocationBanner] = useState('');
  const [category, setCategory] = useState('');
  const [dateRange, setDateRange] = useState(7);
  const [sentiment, setSentiment] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [guestBannerDismissed, setGuestBannerDismissed] = useState(
    sessionStorage.getItem('guestBannerDismissed') === 'true'
  );
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Article[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);

  // Articles state (manual, for load-more append)
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articlesError, setArticlesError] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Breaking news
  const [breakingStories, setBreakingStories] = useState<Article[]>([]);
  const [breakingLoading, setBreakingLoading] = useState(true);

  // Market data
  const [marketData, setMarketData] = useState<MarketItem[]>([]);
  const [marketLoading, setMarketLoading] = useState(true);

  // Live status
  const [liveStatus, setLiveStatus] = useState<{ last_fetched_at: string | null } | null>(null);

  // Hooks for other views
  const { topics, loading: topicsLoading } = useTrendingTopics();
  const { briefs, loading: briefsLoading, isYesterday } = useDailyBrief();
  const { conflicts, loading: conflictsLoading } = useConflicts();

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    const guest = localStorage.getItem('guestMode');
    const email = localStorage.getItem('email') || '';
    if (token) {
      setIsAuthenticated(true);
      setUserEmail(email);
    } else if (guest === 'true') {
      setIsGuest(true);
    } else {
      window.location.href = '/';
    }
  }, []);

  // Parse ?location= URL param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loc = params.get('location');
    if (loc) {
      setSearch(loc);
      setLocationBanner(loc);
    }
  }, []);

  // Load bookmarks from server when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    setBookmarksLoading(true);
    api.getBookmarks()
      .then((data: Article[]) => {
        const arr = Array.isArray(data) ? data : [];
        setBookmarkedArticles(arr);
        setBookmarkedIds(new Set(arr.map((a) => a.id)));
        setBookmarksLoading(false);
      })
      .catch(() => setBookmarksLoading(false));
  }, [isAuthenticated]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Live status
  useEffect(() => {
    api.getStatus().then(setLiveStatus).catch(() => {});
  }, []);

  // Market data
  useEffect(() => {
    setMarketLoading(true);
    api
      .getMarketData()
      .then((d) => {
        setMarketData(d.markets || []);
        setMarketLoading(false);
      })
      .catch(() => setMarketLoading(false));
  }, []);

  // Breaking news (signal_score >= 90)
  useEffect(() => {
    setBreakingLoading(true);
    api
      .getBreakingNews()
      .then((d) => {
        setBreakingStories(Array.isArray(d) ? d : []);
        setBreakingLoading(false);
      })
      .catch(() => setBreakingLoading(false));
  }, []);

  // Main articles — reset on any filter change
  useEffect(() => {
    setArticlesLoading(true);
    setArticlesError(false);
    setOffset(0);
    api
      .getArticles({
        category: category || undefined,
        sentiment: sentiment || undefined,
        search: debouncedSearch || undefined,
        days: dateRange,
        limit: 20,
        offset: 0,
      })
      .then((d) => {
        const arr = Array.isArray(d) ? d : [];
        setArticles(arr);
        setHasMore(arr.length === 20);
        setArticlesLoading(false);
      })
      .catch(() => {
        setArticlesError(true);
        setArticlesLoading(false);
      });
  }, [category, sentiment, debouncedSearch, dateRange]);

  const loadMore = useCallback(() => {
    const nextOffset = offset + 20;
    setLoadingMore(true);
    api
      .getArticles({
        category: category || undefined,
        sentiment: sentiment || undefined,
        search: debouncedSearch || undefined,
        days: dateRange,
        limit: 20,
        offset: nextOffset,
      })
      .then((d) => {
        const arr = Array.isArray(d) ? d : [];
        setArticles((prev) => [...prev, ...arr]);
        setHasMore(arr.length === 20);
        setOffset(nextOffset);
        setLoadingMore(false);
      })
      .catch(() => setLoadingMore(false));
  }, [offset, category, sentiment, debouncedSearch, dateRange]);

  const toggleBookmark = useCallback((id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return;
    if (bookmarkedIds.has(id)) {
      api.removeBookmark(id).catch(() => {});
      setBookmarkedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      setBookmarkedArticles((prev) => prev.filter((a) => a.id !== id));
    } else {
      api.addBookmark(id).catch(() => {});
      setBookmarkedIds((prev) => new Set([...prev, id]));
      const article = articles.find((a) => a.id === id);
      if (article) setBookmarkedArticles((prev) => [article, ...prev]);
    }
  }, [isAuthenticated, bookmarkedIds, articles]);

  return (
    <div className="min-h-screen bg-[#05050A] text-white font-sans relative">
      {/* Radial glow — matches landing page */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(0, 180, 216, 0.06) 0%, transparent 60%)' }}
      />
      <style>{shimmerCSS}</style>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#05050A]/80 backdrop-blur-xl border-b border-[#1a1a1a] h-16 px-6 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => { window.location.href = '/'; }}
          >
            <div className="w-8 h-8 flex-shrink-0">
              <MLogoMark className="w-full h-full" />
            </div>
            <span className="text-lg font-bold tracking-tight uppercase text-white">
              Montridge
            </span>
          </div>
          <a
            href="/map"
            className="group flex items-center gap-2 px-4 py-2 text-[11px] font-bold tracking-[0.12em] uppercase rounded-lg text-[#94A3B8] hover:text-[#00b4d8] transition-all duration-200"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform duration-200"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            Map
          </a>
        </div>

        <div className="flex items-center gap-4 relative">
          {isAuthenticated && (
            <button
              onClick={() => { window.location.href = "/settings"; }}
              className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors text-[#94A3B8] hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {isGuest ? (
            <button
              onClick={() => {
                window.location.href = '/login';
              }}
              className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full border border-[#00B4D8] text-[#00B4D8] hover:bg-[#00B4D8] hover:text-white transition-all"
            >
              Sign In
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all overflow-hidden border ${
                  showProfileMenu
                    ? 'bg-[rgba(0,180,216,0.08)] border-[#00B4D8] text-[#00B4D8]'
                    : 'bg-[#0a0a0a] border-[#1a1a1a] text-[#94A3B8] hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-[#0a0a0a] rounded-xl shadow-2xl border border-[#1a1a1a] p-2 z-[60]"
                  >
                    <div className="px-4 py-3 border-b border-[#1a1a1a] mb-2">
                      <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">
                        Signed in as
                      </p>
                      <p className="text-xs font-bold text-white truncate">
                        {userEmail || 'Authenticated User'}
                      </p>
                    </div>
                    <button
                      onClick={() => { setShowProfileMenu(false); setActiveView('Bookmarks'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold text-white hover:text-[#00B4D8] hover:bg-[rgba(0,180,216,0.08)] rounded-lg transition-all uppercase tracking-wider"
                    >
                      <Bookmark className="w-3.5 h-3.5" /> My Bookmarks
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        window.location.href = "/settings";
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold text-white hover:text-[#00B4D8] hover:bg-[rgba(0,180,216,0.08)] rounded-lg transition-all uppercase tracking-wider"
                    >
                      <Settings className="w-3.5 h-3.5" /> Settings
                    </button>
                    <div className="h-px bg-[#1a1a1a] my-2" />
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        localStorage.removeItem('jwt_token');
                        localStorage.removeItem('guestMode');
                        localStorage.removeItem('email');
                        window.location.href = '/';
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold text-[#F87171] hover:bg-[rgba(239,68,68,0.08)] rounded-lg transition-all uppercase tracking-wider"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-20 px-6 max-w-7xl mx-auto relative z-10 isolate">
        {/* Guest Banner */}
        {isGuest && !guestBannerDismissed && (
          <div className="mb-6 flex items-center justify-between px-5 py-3 rounded-xl bg-[rgba(0,180,216,0.08)] border border-[rgba(0,180,216,0.2)]">
            <span className="text-[#94A3B8] text-sm">
              You're browsing as a guest.{' '}
              <a href="/login" className="text-[#00B4D8] font-semibold hover:underline">
                Sign in
              </a>{' '}
              to save articles and access all features.
            </span>
            <button
              onClick={() => {
                setGuestBannerDismissed(true);
                sessionStorage.setItem('guestBannerDismissed', 'true');
              }}
              className="ml-4 text-[#94A3B8] hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* View Toggle */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-12 overflow-x-auto pb-4 scrollbar-hide border-b border-[#1a1a1a]"
        >
          {((['Normal', 'Quick Insights', 'Trending Topics', 'Daily Debrief'] as View[]).concat(
            isAuthenticated ? ['Bookmarks' as View] : []
          )).map(
            (view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap border ${
                  activeView === view
                    ? 'bg-[#00B4D8] text-white border-[#00B4D8] shadow-lg shadow-[#00B4D8]/20'
                    : 'bg-[#0a0a0a] text-[#94A3B8] hover:text-white border-[#1a1a1a]'
                }`}
              >
                {view}
              </button>
            )
          )}
        </motion.div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── NORMAL VIEW ── */}
            {activeView === 'Normal' && (
              <div className="space-y-14">
                {/* Breaking News */}
                <section>
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 bg-[#00B4D8] rounded-full" />
                      <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white">
                        Intelligence Alert
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                        Signal 90+
                      </span>
                    </div>
                  </div>
                  <BreakingNewsCarousel stories={breakingStories} loading={breakingLoading} />
                </section>

                {/* Filter Bar + Feed */}
                <section>
                  <FilterBar
                    search={search}
                    onSearch={setSearch}
                    category={category}
                    onCategory={setCategory}
                    dateRange={dateRange}
                    onDateRange={setDateRange}
                    sentiment={sentiment}
                    onSentiment={setSentiment}
                  />

                  {locationBanner && (
                    <div className="flex items-center gap-3 px-5 py-2.5 mb-6 bg-[rgba(0,180,216,0.06)] border border-[rgba(0,180,216,0.2)] rounded-xl text-sm">
                      <span className="text-[#94A3B8]">Showing reports from:</span>
                      <span className="text-white font-bold">{locationBanner}</span>
                      <button
                        onClick={() => {
                          setLocationBanner('');
                          setSearch('');
                          window.history.replaceState({}, '', '/dashboard');
                        }}
                        className="ml-auto text-[#94A3B8] hover:text-white text-base leading-none transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-[#00B4D8] rounded-full" />
                        <h2 className="text-2xl font-bold tracking-tight uppercase text-white">
                          Global Intelligence Feed
                        </h2>
                      </div>
                      <p className="text-[#94A3B8] text-xs font-medium ml-4">
                        Synthesized reports from verified global sources
                      </p>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-[#1a1a1a] rounded-xl text-[10px] font-black text-[#94A3B8] uppercase tracking-widest border border-[#1a1a1a]">
                      {articles.length} Active Reports
                    </div>
                  </div>

                  {articlesLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6"
                        >
                          <div className="flex justify-between mb-5">
                            <SkeletonBlock className="h-5 w-20" />
                            <SkeletonBlock className="h-5 w-16" />
                          </div>
                          <SkeletonBlock className="h-6 w-full mb-2" />
                          <SkeletonBlock className="h-6 w-3/4 mb-4" />
                          <SkeletonBlock className="h-4 w-full mb-1" />
                          <SkeletonBlock className="h-4 w-full mb-1" />
                          <SkeletonBlock className="h-4 w-2/3 mb-8" />
                          <div className="flex justify-between pt-5 border-t border-[#1a1a1a]">
                            <SkeletonBlock className="h-4 w-24" />
                            <SkeletonBlock className="h-4 w-16" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : articlesError ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <p className="text-[#94A3B8] text-sm">
                        Unable to reach intelligence feed. Verify backend connection.
                      </p>
                      <button
                        onClick={() => {
                          setArticlesError(false);
                          setArticlesLoading(true);
                          api
                            .getArticles({ limit: 20, offset: 0 })
                            .then((d) => {
                              setArticles(Array.isArray(d) ? d : []);
                              setArticlesLoading(false);
                            })
                            .catch(() => {
                              setArticlesError(true);
                              setArticlesLoading(false);
                            });
                        }}
                        className="px-5 py-2 text-[10px] font-black uppercase tracking-widest border border-[#00B4D8] text-[#00B4D8] rounded-lg hover:bg-[rgba(0,180,216,0.08)] transition-all"
                      >
                        Retry Connection
                      </button>
                    </div>
                  ) : articles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <p className="text-[#94A3B8] text-sm">
                        No reports found matching current filters.
                      </p>
                      <button
                        onClick={() => {
                          setSearch('');
                          setCategory('');
                          setSentiment('');
                          setDateRange(7);
                        }}
                        className="text-[#00B4D8] text-xs font-semibold hover:underline"
                      >
                        Clear all filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {articles.map((article) => (
                        <ArticleCard
                          key={article.id}
                          article={article}
                          isAuthenticated={isAuthenticated}
                          isBookmarked={bookmarkedIds.has(article.id)}
                          onBookmark={toggleBookmark}
                        />
                      ))}
                    </div>
                  )}

                  {hasMore && !articlesLoading && !articlesError && articles.length > 0 && (
                    <div className="flex justify-center pt-16">
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="group relative px-10 py-4 bg-transparent border border-[#1a1a1a] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-[#94A3B8] hover:bg-[rgba(0,180,216,0.08)] hover:border-[#00B4D8]/30 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingMore ? 'Loading...' : 'Load More Intelligence'}
                      </button>
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* ── QUICK INSIGHTS VIEW ── */}
            {activeView === 'Quick Insights' && (
              <QuickInsightsSection
                marketData={marketData}
                marketLoading={marketLoading}
                conflicts={conflicts}
                conflictsLoading={conflictsLoading}
              />
            )}

            {/* ── TRENDING TOPICS VIEW ── */}
            {activeView === 'Trending Topics' && (
              <TrendingTopicsSection
                topics={topics}
                loading={topicsLoading}
                onTopicClick={(topic) => {
                  setSearch(topic);
                  setActiveView('Normal');
                }}
              />
            )}

            {/* ── DAILY DEBRIEF VIEW ── */}
            {activeView === 'Daily Debrief' && (
              <DailyDebriefSection
                briefs={briefs}
                loading={briefsLoading}
                isYesterday={isYesterday}
              />
            )}

            {/* ── BOOKMARKS VIEW ── */}
            {activeView === 'Bookmarks' && (
              <div className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#0a0a0a] rounded-2xl flex items-center justify-center text-[#00B4D8] shadow-xl">
                    <Bookmark className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight uppercase text-white">
                      Saved Articles
                    </h2>
                    <p className="text-[#94A3B8] text-xs font-medium">
                      {bookmarkedArticles.length} article{bookmarkedArticles.length !== 1 ? 's' : ''} saved
                    </p>
                  </div>
                </div>

                {bookmarksLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
                        <div className="flex justify-between mb-5">
                          <SkeletonBlock className="h-5 w-20" />
                          <SkeletonBlock className="h-5 w-16" />
                        </div>
                        <SkeletonBlock className="h-6 w-full mb-2" />
                        <SkeletonBlock className="h-6 w-3/4 mb-8" />
                        <div className="flex justify-between pt-5 border-t border-[#1a1a1a]">
                          <SkeletonBlock className="h-4 w-24" />
                          <SkeletonBlock className="h-4 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : bookmarkedArticles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Bookmark className="w-12 h-12 text-[#1a1a1a]" />
                    <p className="text-[#94A3B8] text-sm">No saved articles yet.</p>
                    <button
                      onClick={() => setActiveView('Normal')}
                      className="text-[#00B4D8] text-xs font-semibold hover:underline"
                    >
                      Browse the feed
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {bookmarkedArticles.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        isAuthenticated={isAuthenticated}
                        isBookmarked={bookmarkedIds.has(article.id)}
                        onBookmark={toggleBookmark}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Settings Modal */}
      {showSettings && isAuthenticated && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl w-full max-w-lg mx-4 p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-[#94A3B8] hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="mb-6">
              <h3 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-3">
                Account
              </h3>
              <p className="text-sm text-white mb-3">{userEmail}</p>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-3 bg-[#00B4D8] hover:bg-[#0088A8] text-white font-bold rounded-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

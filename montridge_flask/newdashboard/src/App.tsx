import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import ArticleDetail from './pages/ArticleDetail';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const [loading, setLoading] = useState(true);

  // Detect article detail pages from URL (e.g. /intelligence/123)
  const articleMatch = window.location.pathname.match(/^\/intelligence\/(\d+)$/);
  const articleId = articleMatch ? parseInt(articleMatch[1], 10) : null;

  return (
    <div className="font-sans selection:bg-[#00B4D8]/20 selection:text-white">
      {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      {articleId !== null ? <ArticleDetail id={articleId} /> : <Dashboard />}
    </div>
  );
}

export default App;

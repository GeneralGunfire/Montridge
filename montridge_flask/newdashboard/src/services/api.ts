// TODO: move BASE_URL to .env as VITE_API_BASE_URL before production
// Using relative URLs: works same-origin in production (Flask), proxied in dev (Vite → Flask)
const BASE_URL = ''

function getHeaders() {
  const token = localStorage.getItem('jwt_token')
  return {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

async function handleResponse(r: Response) {
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`)
  return r.json()
}

export const api = {
  getArticles: (params?: {
    category?: string
    sentiment?: string
    search?: string
    importance?: string
    days?: number
    limit?: number
    offset?: number
    min_score?: number
  }) => {
    // Strip undefined/null/empty values to prevent "?search=undefined" in URL
    const clean: Record<string, string> = {}
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') clean[k] = String(v)
      })
    }
    const qs = new URLSearchParams(clean).toString()
    return fetch(`${BASE_URL}/api/articles${qs ? '?' + qs : ''}`, { headers: getHeaders() })
      .then(handleResponse)
  },

  getArticle: (id: number) =>
    fetch(`${BASE_URL}/api/article/${id}`, { headers: getHeaders() }).then(handleResponse),

  getBreakingNews: () =>
    fetch(`${BASE_URL}/api/articles?min_score=90&limit=10`, { headers: getHeaders() }).then(handleResponse),

  getStatus: () =>
    fetch(`${BASE_URL}/api/status`, { headers: getHeaders() }).then(handleResponse),

  getTrendingTopics: () =>
    fetch(`${BASE_URL}/api/trending-topics`, { headers: getHeaders() }).then(handleResponse),

  getDailyBrief: () =>
    fetch(`${BASE_URL}/api/daily-brief`, { headers: getHeaders() }).then(handleResponse),

  getMarketData: () =>
    fetch(`${BASE_URL}/api/market-data`, { headers: getHeaders() }).then(handleResponse),

  getConflicts: () =>
    fetch(`${BASE_URL}/api/conflicts`, { headers: getHeaders() }).then(handleResponse),

  getPerspectives: (id: number) =>
    fetch(`${BASE_URL}/api/article/${id}/perspectives`, { headers: getHeaders() }).then(handleResponse),

  search: (q: string) =>
    fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(q)}`, { headers: getHeaders() }).then(handleResponse),

  getBookmarks: () =>
    fetch(`${BASE_URL}/api/bookmarks`, { headers: getHeaders() }).then(handleResponse),

  addBookmark: (articleId: number) =>
    fetch(`${BASE_URL}/api/bookmarks`, {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ article_id: articleId }),
    }).then(handleResponse),

  removeBookmark: (articleId: number) =>
    fetch(`${BASE_URL}/api/bookmarks/${articleId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(handleResponse),
}

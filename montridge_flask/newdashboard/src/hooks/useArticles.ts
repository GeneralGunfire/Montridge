import { useState, useEffect } from 'react'
import { api } from '../services/api'

function safeArray<T>(data: unknown, key?: string): T[] {
  if (key && data && typeof data === 'object' && !Array.isArray(data)) {
    const val = (data as Record<string, unknown>)[key]
    if (Array.isArray(val)) return val as T[]
  }
  if (Array.isArray(data)) return data as T[]
  return []
}

export function useArticles(filters?: Record<string, unknown>, retryKey = 0) {
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.getArticles(filters as any)
      .then(data => {
        setArticles(safeArray(data, 'articles'))
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load articles')
        setLoading(false)
      })
  }, [JSON.stringify(filters), retryKey])

  return { articles, loading, error }
}

export function useBreakingNews(retryKey = 0) {
  const [stories, setStories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getBreakingNews()
      .then(data => {
        setStories(safeArray(data, 'articles'))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [retryKey])

  return { stories, loading }
}

export function useTrendingTopics(retryKey = 0) {
  const [topics, setTopics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getTrendingTopics()
      .then(data => {
        setTopics(safeArray(data, 'topics'))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [retryKey])

  return { topics, loading }
}

export function useDailyBrief(retryKey = 0) {
  const [briefs, setBriefs] = useState<any[]>([])
  const [isYesterday, setIsYesterday] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getDailyBrief()
      .then(data => {
        setBriefs(safeArray(data, 'briefs'))
        setIsYesterday(!!(data as any)?.is_yesterday)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [retryKey])

  return { briefs, loading, isYesterday }
}

export function useConflicts(retryKey = 0) {
  const [conflicts, setConflicts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getConflicts()
      .then(data => {
        setConflicts(safeArray(data, 'conflicts'))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [retryKey])

  return { conflicts, loading }
}

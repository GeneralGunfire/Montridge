import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { category, search, importance, sentiment, source, days = '7', limit = '20', offset = '0' } = req.query

    let sql = `
      SELECT *
      FROM articles
      WHERE processed_at IS NOT NULL
      AND published_date >= NOW() - INTERVAL '${days} days'
    `
    const params: any[] = []

    if (category) {
      sql += ` AND LOWER(category) = LOWER($${params.length + 1})`
      params.push(category)
    }

    if (search) {
      sql += ` AND (title ILIKE $${params.length + 1} OR summary ILIKE $${params.length + 2})`
      params.push(`%${search}%`, `%${search}%`)
    }

    if (importance === 'high') sql += ` AND signal_score >= 75`
    if (importance === 'medium') sql += ` AND signal_score BETWEEN 45 AND 74`
    if (importance === 'low') sql += ` AND signal_score < 45`

    if (sentiment) {
      sql += ` AND LOWER(sentiment) = LOWER($${params.length + 1})`
      params.push(sentiment)
    }

    if (source) {
      sql += ` AND source ILIKE $${params.length + 1}`
      params.push(`%${source}%`)
    }

    sql += ` ORDER BY signal_score DESC NULLS LAST, published_date DESC LIMIT ${limit} OFFSET ${offset}`

    const articles = await query(sql, params)
    res.status(200).json(articles)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch articles' })
  }
}

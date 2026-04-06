import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query
    const articles = await query(
      'SELECT * FROM articles WHERE id = $1 AND processed_at IS NOT NULL',
      [id]
    )

    if (articles.length === 0) {
      return res.status(404).json({ error: 'Article not found' })
    }

    res.status(200).json(articles[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch article' })
  }
}

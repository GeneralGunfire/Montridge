import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const topics = await query(`
      SELECT categories, entities
      FROM articles
      WHERE processed_at IS NOT NULL
      AND published_date >= NOW() - INTERVAL '24 hours'
    `)

    const topicCounts: Record<string, number> = {}

    for (const row of topics) {
      if (row.categories) {
        for (const cat of row.categories) {
          topicCounts[cat] = (topicCounts[cat] || 0) + 1
        }
      }
    }

    const result = Object.entries(topicCounts)
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count, trending: true }))

    res.status(200).json({ topics: result })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch trending topics' })
  }
}

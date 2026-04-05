import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const result = await query(
      'SELECT MAX(processed_at) as last_fetched_at FROM articles WHERE processed_at IS NOT NULL'
    )

    res.status(200).json({
      last_fetched_at: result[0]?.last_fetched_at || null,
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to get status' })
  }
}

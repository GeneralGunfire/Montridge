import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      app: 'Montridge Next.js',
      environment: process.env.NODE_ENV || 'development',
      message: 'Application is running. Configure Groq API keys and database connection in environment variables.',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to get status' })
  }
}

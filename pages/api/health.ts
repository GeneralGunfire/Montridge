import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      groq_configured: !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'placeholder',
      db_configured: !!process.env.DB_HOST && process.env.DB_HOST !== 'placeholder',
      jwt_configured: !!process.env.JWT_SECRET_KEY && process.env.JWT_SECRET_KEY !== 'placeholder',
    }
  }
  res.status(200).json(health)
}

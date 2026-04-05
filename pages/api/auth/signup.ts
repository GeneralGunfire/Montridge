import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { hashPassword, createJWT } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password, name = 'User' } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const passwordHash = hashPassword(password)
    const result = await query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id',
      [email, passwordHash, name]
    )

    const userId = result[0].id
    const token = createJWT(userId, email)

    res.status(201).json({ token, user_id: userId, email })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Signup failed' })
  }
}

import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { verifyPassword, createJWT } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    const users = await query('SELECT id, password_hash, name FROM users WHERE email = $1', [email])

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const user = users[0]
    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = createJWT(user.id, email)
    res.status(200).json({ token, user_id: user.id, email, name: user.name })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Login failed' })
  }
}

import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'change-this-in-production'

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

export function createJWT(userId: number, email: string): string {
  return jwt.sign(
    { user_id: userId, email, iat: Date.now(), exp: Date.now() + 24 * 60 * 60 * 1000 },
    SECRET_KEY,
    { algorithm: 'HS256' }
  )
}

export function verifyJWT(token: string): any {
  try {
    return jwt.verify(token, SECRET_KEY)
  } catch (error) {
    return null
  }
}

export function extractTokenFromHeader(authHeader: string): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  return parts[1]
}

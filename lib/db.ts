import { Pool } from 'pg'

let pool: Pool | null = null

function getPool() {
  if (!pool) {
    pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'montridge_db',
    })
  }
  return pool
}

export async function query(sql: string, params: any[] = []) {
  try {
    const p = getPool()
    const res = await p.query(sql, params)
    return res.rows
  } catch (error) {
    console.error('Database query error:', error)
    // Return empty array instead of throwing for graceful degradation
    return []
  }
}

export async function getConnection() {
  return getPool()
}

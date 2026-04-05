import { Pool } from 'pg'

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'montridge_db',
})

export async function query(sql: string, params: any[] = []) {
  try {
    const res = await pool.query(sql, params)
    return res.rows
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

export async function getConnection() {
  return pool
}

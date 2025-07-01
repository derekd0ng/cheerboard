import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database connection
let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    res.json({ status: 'ok', database: pool ? 'connected' : 'in-memory' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST to clear messages.' });
  }

  try {
    if (pool) {
      console.log('Clearing all messages from database...');
      
      // Delete reactions first (due to foreign key constraint)
      const reactionsResult = await pool.query('DELETE FROM reactions');
      console.log(`Deleted ${reactionsResult.rowCount} reactions`);
      
      // Delete messages
      const messagesResult = await pool.query('DELETE FROM messages');
      console.log(`Deleted ${messagesResult.rowCount} messages`);
      
      res.json({ 
        success: true, 
        message: 'All messages and reactions cleared successfully',
        deletedMessages: messagesResult.rowCount,
        deletedReactions: reactionsResult.rowCount
      });
    } else {
      res.status(400).json({ 
        error: 'Database not available. Using in-memory storage.' 
      });
    }
  } catch (error) {
    console.error('Error clearing messages:', error);
    res.status(500).json({ 
      error: 'Failed to clear messages', 
      details: error.message 
    });
  }
}
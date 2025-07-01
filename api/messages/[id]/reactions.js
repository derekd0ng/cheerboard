import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// In-memory reactions storage
let reactions = {};

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
  const { id } = req.query;
  const messageId = parseInt(id);
  
  console.log(`${req.method} /api/messages/${messageId}/reactions called`);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { reaction } = req.body;
    
    if (!['heart', 'star', 'plus', 'blessed'].includes(reaction)) {
      return res.status(400).json({ error: 'Invalid reaction type' });
    }

    try {
      if (pool) {
        console.log('Adding reaction to database:', { messageId, reaction });
        
        // Check if message exists
        const messageCheck = await pool.query('SELECT id FROM messages WHERE id = $1', [messageId]);
        if (messageCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Message not found' });
        }
        
        // Add reaction
        await pool.query(
          'INSERT INTO reactions (message_id, reaction_type) VALUES ($1, $2)',
          [messageId, reaction]
        );
        
        // Get updated reaction counts
        const reactionsResult = await pool.query(
          'SELECT reaction_type, COUNT(*) as count FROM reactions WHERE message_id = $1 GROUP BY reaction_type',
          [messageId]
        );
        
        const reactionCounts = { heart: 0, star: 0, plus: 0, blessed: 0 };
        reactionsResult.rows.forEach(row => {
          reactionCounts[row.reaction_type] = parseInt(row.count);
        });
        
        res.json({ reactions: reactionCounts });
      } else {
        console.log('Adding reaction to in-memory storage:', { messageId, reaction });
        
        // In-memory storage
        if (!reactions[messageId]) {
          reactions[messageId] = { heart: 0, star: 0, plus: 0, blessed: 0 };
        }
        reactions[messageId][reaction]++;
        
        res.json({ reactions: reactions[messageId] });
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      res.status(500).json({ error: 'Failed to add reaction' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
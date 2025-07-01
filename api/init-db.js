import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST to initialize database.' });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(400).json({ error: 'DATABASE_URL environment variable is required' });
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to Neon PostgreSQL database...');
    
    // Create tables
    console.log('Creating tables...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        color VARCHAR(20) DEFAULT 'yellow'
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reactions (
        id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('heart', 'star', 'plus', 'blessed')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON reactions(message_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_reactions_type ON reactions(message_id, reaction_type);
    `);
    
    // Check if we need to add sample data
    const result = await pool.query('SELECT COUNT(*) FROM messages');
    const messageCount = parseInt(result.rows[0].count);
    
    if (messageCount === 0) {
      console.log('Adding sample data...');
      const sampleMessages = [
        {
          content: "Welcome to The Cheer Board! 🌟",
          color: 'yellow'
        },
        {
          content: "You're doing great today! Keep going! 💪",
          color: 'orange'
        },
        {
          content: "Remember to smile - it's contagious! 😊",
          color: 'green'
        }
      ];

      for (const message of sampleMessages) {
        await pool.query(
          'INSERT INTO messages (content, color) VALUES ($1, $2)',
          [message.content, message.color]
        );
      }
      
      console.log('Sample data added successfully!');
    }
    
    console.log('Database initialization completed successfully!');
    res.json({ 
      success: true, 
      message: 'Database initialized successfully',
      messagesCount: messageCount + (messageCount === 0 ? 3 : 0)
    });
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    res.status(500).json({ 
      error: 'Database initialization failed', 
      details: error.message 
    });
  } finally {
    await pool.end();
  }
}
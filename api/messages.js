import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// In-memory storage for development
let messages = [
  { id: 1, content: "Welcome to The Cheer Board! 🌟", created_at: new Date().toISOString(), reactions: { heart: 0, star: 0, plus: 0, blessed: 0 }, color: 'yellow' },
  { id: 2, content: "You're doing great today! Keep going! 💪", created_at: new Date(Date.now() - 60000).toISOString(), reactions: { heart: 0, star: 0, plus: 0, blessed: 0 }, color: 'orange' },
  { id: 3, content: "Remember to smile - it's contagious! 😊", created_at: new Date(Date.now() - 120000).toISOString(), reactions: { heart: 0, star: 0, plus: 0, blessed: 0 }, color: 'green' }
];
let nextId = 4;
let colorCounter = 3;

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
  console.log(`${req.method} /api/messages called`);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      if (pool) {
        const messagesResult = await pool.query(
          'SELECT id, content, created_at, color FROM messages ORDER BY created_at DESC LIMIT 50'
        );
        
        // Get reactions for each message
        const messagesWithReactions = await Promise.all(
          messagesResult.rows.map(async (message) => {
            const reactionsResult = await pool.query(
              'SELECT reaction_type, COUNT(*) as count FROM reactions WHERE message_id = $1 GROUP BY reaction_type',
              [message.id]
            );
            
            const reactions = { heart: 0, star: 0, plus: 0, blessed: 0 };
            reactionsResult.rows.forEach(row => {
              reactions[row.reaction_type] = parseInt(row.count);
            });
            
            return { ...message, reactions };
          })
        );
        
        res.json(messagesWithReactions);
      } else {
        // Use in-memory storage
        res.json(messages.slice().reverse().slice(0, 50));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  else if (req.method === 'POST') {
    console.log('Request body:', req.body);
    
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      console.log('Error: Message content is required');
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    if (content.length > 280) {
      console.log('Error: Message too long');
      return res.status(400).json({ error: 'Message too long (max 280 characters)' });
    }

    try {
      const colors = ['yellow', 'orange', 'green', 'blue', 'pink', 'purple'];
      console.log('Using database?', !!pool);
      
      if (pool) {
        console.log('Attempting database insertion...');
        const countResult = await pool.query('SELECT COUNT(*) FROM messages');
        const messageCount = parseInt(countResult.rows[0].count);
        const colorIndex = messageCount % colors.length;
        const noteColor = colors[colorIndex];
        
        console.log('Inserting message with color:', noteColor);
        const result = await pool.query(
          'INSERT INTO messages (content, color) VALUES ($1, $2) RETURNING id, content, created_at, color',
          [content.trim(), noteColor]
        );
        console.log('Database insertion successful:', result.rows[0]);
        res.status(201).json(result.rows[0]);
      } else {
        console.log('Using in-memory storage...');
        const colorIndex = colorCounter % colors.length;
        const noteColor = colors[colorIndex];
        colorCounter++;
        
        const newMessage = {
          id: nextId++,
          content: content.trim(),
          created_at: new Date().toISOString(),
          reactions: { heart: 0, star: 0, plus: 0, blessed: 0 },
          color: noteColor
        };
        messages.unshift(newMessage);
        console.log('In-memory insertion successful:', newMessage);
        res.status(201).json(newMessage);
      }
    } catch (error) {
      console.error('Error creating message:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: 'Failed to create message', details: error.message });
    }
  }

  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const app = express();
const port = process.env.PORT || 3001;

// In-memory storage for local development when no database is configured
let messages = [
  { id: 1, content: "Welcome to The Cheer Board! 🌟", created_at: new Date().toISOString(), reactions: { heart: 0, star: 0, plus: 0, blessed: 0 }, color: 'yellow' },
  { id: 2, content: "You're doing great today! Keep going! 💪", created_at: new Date(Date.now() - 60000).toISOString(), reactions: { heart: 0, star: 0, plus: 0, blessed: 0 }, color: 'orange' },
  { id: 3, content: "Remember to smile - it's contagious! 😊", created_at: new Date(Date.now() - 120000).toISOString(), reactions: { heart: 0, star: 0, plus: 0, blessed: 0 }, color: 'green' }
];
let nextId = 4;
let colorCounter = 3; // Start after the 3 existing messages (yellow=0, orange=1, green=2)

// In-memory reactions storage
let reactions = {}; // messageId -> { reactionType -> count }

// Database connection - prioritize Neon PostgreSQL for production
let pool;
const isDevelopment = process.env.NODE_ENV !== 'production';

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    // Neon-specific connection settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  // Test database connection on startup
  pool.connect((err, client, release) => {
    if (err) {
      console.error('Error acquiring client', err.stack);
    } else {
      console.log('Successfully connected to Neon PostgreSQL database');
      release();
    }
  });
} else if (isDevelopment) {
  console.log('DATABASE_URL not found, using in-memory storage for development');
} else {
  console.error('DATABASE_URL is required for production deployment');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: pool ? 'connected' : 'in-memory' });
});

app.get('/api/messages', async (req, res) => {
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
});

app.post('/api/messages', async (req, res) => {
  console.log('POST /api/messages called');
  console.log('Request body:', req.body);
  console.log('Content-Type:', req.headers['content-type']);
  
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
    // Define available colors for notes
    const colors = ['yellow', 'orange', 'green', 'blue', 'pink', 'purple'];
    
    console.log('Using database?', !!pool);
    
    if (pool) {
      console.log('Attempting database insertion...');
      // For database: get the count of existing messages to determine next color
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
      // Use in-memory storage  
      const colorIndex = colorCounter % colors.length;
      const noteColor = colors[colorIndex];
      colorCounter++; // Increment for next message
      
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
});

// Add reaction to a message
app.post('/api/messages/:id/reactions', async (req, res) => {
  const messageId = parseInt(req.params.id);
  const { reaction } = req.body;
  
  const validReactions = ['heart', 'star', 'plus', 'blessed'];
  if (!validReactions.includes(reaction)) {
    return res.status(400).json({ error: 'Invalid reaction type' });
  }
  
  try {
    if (pool) {
      // Database implementation
      await pool.query(
        'INSERT INTO reactions (message_id, reaction_type) VALUES ($1, $2)',
        [messageId, reaction]
      );
      
      // Get updated reaction counts
      const reactionsResult = await pool.query(
        'SELECT reaction_type, COUNT(*) as count FROM reactions WHERE message_id = $1 GROUP BY reaction_type',
        [messageId]
      );
      
      const reactions = { heart: 0, star: 0, plus: 0, blessed: 0 };
      reactionsResult.rows.forEach(row => {
        reactions[row.reaction_type] = parseInt(row.count);
      });
      
      res.json({ reactions });
    } else {
      // In-memory storage
      const message = messages.find(m => m.id === messageId);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      message.reactions[reaction]++;
      res.json({ reactions: message.reactions });
    }
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Delete a message (for cleanup purposes)
app.delete('/api/messages/:id', async (req, res) => {
  const messageId = parseInt(req.params.id);
  
  try {
    if (pool) {
      // Database implementation
      const result = await pool.query('DELETE FROM messages WHERE id = $1 RETURNING id', [messageId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Message not found' });
      }
      // Also delete associated reactions
      await pool.query('DELETE FROM reactions WHERE message_id = $1', [messageId]);
      res.json({ message: 'Message deleted successfully' });
    } else {
      // In-memory storage
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      messages.splice(messageIndex, 1);
      res.json({ message: 'Message deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Database mode: ${pool ? 'enabled' : 'disabled (using in-memory storage)'}`);
    if (!pool) {
      console.log('Initial messages loaded:', messages.map(m => ({id: m.id, color: m.color})));
    }
  });
}

// Export for Vercel serverless functions
export default app;
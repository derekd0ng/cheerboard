import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to Neon PostgreSQL database...');
    
    // Read and execute schema
    const schemaPath = path.join(process.cwd(), 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Creating tables...');
    await pool.query(schema);
    
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
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run initialization
initializeDatabase();
# The Cheer Board 🌟

A minimalistic public board where people can share uplifting messages to cheer each other up.

## Features

- Simple message posting (max 280 characters)
- Public board displaying all messages
- Real-time updates
- Clean, responsive design
- Deployed on Vercel with Neon database

## Tech Stack

- **Frontend**: React with Vite
- **Backend**: Express.js API
- **Database**: PostgreSQL (Neon)
- **Deployment**: Vercel

## Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   npm run install:all
   ```

2. **Set up environment variables**:
   - Copy `.env.example` to `.env`
   - Add your Neon database URL to `DATABASE_URL`

3. **Set up database**:
   - Run the SQL schema from `api/schema.sql` in your Neon console

4. **Start development servers**:
   ```bash
   npm run dev
   ```

   This starts both the React frontend (http://localhost:5173) and Express API (http://localhost:3001).

## Deployment

This app is configured for Vercel deployment:

1. Push to GitHub
2. Connect repository to Vercel
3. Add `DATABASE_URL` environment variable in Vercel dashboard
4. Deploy

The `vercel.json` configuration handles routing between the frontend and API.

## Project Structure

```
theboard/
├── client/          # React frontend
│   ├── src/
│   │   ├── App.jsx  # Main app component
│   │   └── App.css  # Styles
│   └── dist/        # Build output
├── api/             # Express.js backend
│   ├── index.js     # API server
│   └── schema.sql   # Database schema
└── vercel.json      # Vercel configuration
```

## API Endpoints

- `GET /api/messages` - Fetch recent messages
- `POST /api/messages` - Create new message
- `GET /api/health` - Health check
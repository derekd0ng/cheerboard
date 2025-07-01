# The Board 🌟💀

A dual-tab emotional outlet application with Russian localization, featuring both uplifting messages and private venting capabilities.

## Features

### 🪐 The Cheer Board
- Share uplifting messages to brighten someone's day
- Colorful post-it note design with emoji reactions
- Persistent messages stored in database
- Interactive reactions (❤️ ⭐ ➕ 🙏)

### 💀 The Vent Board  
- Private space to let off steam
- Messages disappear with animated dissolution
- Dark theme with atmospheric design
- No message persistence - complete privacy

### Technical Features
- **Dual-tab system** with smooth sliding animations
- **Russian localization** for all UI elements
- **Responsive glassmorphism design** with backdrop blur effects
- **Real-time animations** and theme switching
- **Production-ready deployment** on Vercel with Neon PostgreSQL

## Tech Stack

- **Frontend**: React 19 with Vite 7
- **Backend**: Express.js API with serverless functions
- **Database**: Neon PostgreSQL (production) / In-memory (development)
- **Deployment**: Vercel
- **Styling**: Modern CSS with glassmorphism effects

## Quick Start

### Development Setup

1. **Clone and install**:
   ```bash
   git clone <repository-url>
   cd theboard
   npm run install:all
   ```

2. **Environment setup**:
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Add your Neon database URL (optional for development)
   # Without DATABASE_URL, app uses in-memory storage
   ```

3. **Start development**:
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:5173
   - API: http://localhost:3001/api/health

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

**Quick Deploy to Vercel:**

1. **Set up Neon Database**:
   - Create account at [Neon Console](https://console.neon.tech/)
   - Create project and copy connection string

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```
   
3. **Configure Environment**:
   - Add `DATABASE_URL` in Vercel dashboard
   - Run database initialization: `npm run init-db`

## Project Structure

```
theboard/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main dual-tab component  
│   │   ├── App.css        # Responsive glassmorphism styles
│   │   └── main.jsx       # React entry point
│   └── dist/              # Build output
├── api/                   # Express.js API
│   ├── index.js          # Main server with database logic
│   ├── init-db.js        # Database initialization
│   └── schema.sql        # PostgreSQL schema
├── vercel.json           # Vercel deployment config
├── DEPLOYMENT.md         # Comprehensive deployment guide
└── test-deployment.js    # Deployment verification script
```

## API Endpoints

### Messages
- `GET /api/messages` - Fetch cheer board messages
- `POST /api/messages` - Create new message (cheer board only)
- `DELETE /api/messages/:id` - Delete message (cleanup)

### Reactions  
- `POST /api/messages/:id/reactions` - Add reaction to message

### Utility
- `GET /api/health` - Health check with database status

## Scripts

```bash
# Development
npm run dev              # Start both frontend and API
npm run dev:client       # Frontend only
npm run dev:server       # API only

# Production
npm run build            # Build for production
npm run vercel-build     # Vercel-specific build
npm run start            # Start production server

# Database
npm run init-db          # Initialize Neon database
npm run test-deployment  # Test API endpoints

# Installation
npm run install:all      # Install all dependencies
npm run install:client   # Frontend dependencies only  
npm run install:server   # API dependencies only
```

## Features Deep Dive

### Dual-Tab Interface
- **Seamless transitions**: Unidirectional slide animations (left-to-right)
- **Context-aware theming**: Light glassmorphism vs dark gradient
- **Dynamic navigation**: Tab-specific button layouts and hover effects

### Russian Localization
- **Cheer Tab**: "Поделись радостью, поддержи или поблагодари коллег!"
- **Vent Tab**: "Выпусти пар - что тебя достало?"
- **Atmospheric messaging**: "Пусть твои переживания растворятся в темноте 🌌"

### Advanced Animations
- **Message dissolution**: Color transition from deep red to black
- **Sliding transitions**: CSS-based with cubic-bezier timing
- **Glassmorphism effects**: Backdrop blur with transparency
- **Responsive design**: Consistent across all screen sizes

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Production |
| `NODE_ENV` | Application environment | Auto-set |
| `PORT` | Server port | Optional (3001) |

## License

MIT License - see LICENSE file for details.
# Deployment Guide for The Board

This guide covers deploying The Board application to Vercel with Neon PostgreSQL database.

## Prerequisites

1. **Neon PostgreSQL Database**
   - Create account at [Neon Console](https://console.neon.tech/)
   - Create a new project
   - Copy the connection string

2. **Vercel Account**
   - Create account at [Vercel](https://vercel.com/)
   - Install Vercel CLI: `npm i -g vercel`

## Database Setup

### Step 1: Create Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project called "theboard"
3. Copy the connection string (format: `postgresql://username:password@hostname/database`)

### Step 2: Initialize Database Schema

The database will be automatically initialized on first deployment, but you can manually run:

```bash
# Set your DATABASE_URL environment variable
export DATABASE_URL="your_neon_connection_string"

# Initialize database
npm run init-db
```

## Vercel Deployment

### Step 1: Environment Variables

In your Vercel project dashboard, add these environment variables:

```
DATABASE_URL=postgresql://username:password@ep-hostname.us-east-1.aws.neon.tech/theboard?sslmode=require
NODE_ENV=production
```

### Step 2: Deploy

Option A - Deploy via Vercel CLI:
```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

Option B - Deploy via GitHub:
1. Push code to GitHub repository
2. Connect repository in Vercel dashboard
3. Configure environment variables
4. Deploy

### Step 3: Verify Deployment

1. Check API health: `https://your-app.vercel.app/api/health`
2. Test the application functionality
3. Verify database connectivity

## Configuration Files

- `vercel.json` - Vercel deployment configuration
- `.env.example` - Environment variables template
- `api/init-db.js` - Database initialization script
- `api/schema.sql` - Database schema

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL format
   - Check Neon database is active
   - Ensure SSL is properly configured

2. **Build Failures**
   - Check all dependencies are installed
   - Verify Node.js version compatibility
   - Review build logs in Vercel dashboard

3. **API Routes Not Working**
   - Verify vercel.json routing configuration
   - Check function timeout settings
   - Review serverless function logs

### Debug Steps

1. Check Vercel deployment logs
2. Test API endpoints individually
3. Verify environment variables are set
4. Check database connectivity with health endpoint

## Production Considerations

1. **Database Scaling**: Neon automatically scales based on usage
2. **Function Timeouts**: API functions have 30-second timeout
3. **Rate Limiting**: Consider implementing rate limiting for production
4. **Monitoring**: Set up error tracking and monitoring
5. **Backups**: Neon provides automatic backups

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |
| `NODE_ENV` | Application environment (production) | Yes |
| `PORT` | Server port (auto-set by Vercel) | No |

## Architecture

```
Frontend (Vercel) → API Routes (Vercel Functions) → Neon PostgreSQL
```

The application is deployed as:
- **Frontend**: Static files served by Vercel
- **API**: Serverless functions on Vercel
- **Database**: Managed PostgreSQL on Neon
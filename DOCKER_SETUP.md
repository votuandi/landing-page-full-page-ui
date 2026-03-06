# Docker Setup Guide

This guide will help you set up the Next.js application and PostgreSQL database using Docker.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose installed (usually comes with Docker Desktop)

## Quick Start

1. **Create environment file**

   Create a `.env` file in the root directory with the following content:

   ```env
   # Database
   DATABASE_URL=postgresql://postgres:postgres@postgres:5432/landing_page_db?schema=public

   # PostgreSQL Configuration (for Docker)
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=landing_page_db
   POSTGRES_PORT=5432

   # Next.js Configuration
   NEXTJS_PORT=3000
   NODE_ENV=development
   ```

2. **Start all services**

   ```bash
   docker-compose up -d
   ```

   This will:
   - Start PostgreSQL database container
   - Build and start Next.js application container
   - Set up auto-restart on system boot

3. **Initialize database**

   Wait for containers to start (about 30 seconds), then run:

   ```bash
   docker-compose exec nextjs npx prisma db push
   ```

   Or generate Prisma client and push schema:

   ```bash
   docker-compose exec nextjs npx prisma generate
   docker-compose exec nextjs npx prisma db push
   ```

4. **Access the application**

   - Next.js app: http://localhost:3000
   - API endpoints: http://localhost:3000/api/banners
   - PostgreSQL: localhost:5432

## Useful Commands

### Start services
```bash
docker-compose up -d
# or
npm run docker:up
```

### Stop services
```bash
docker-compose down
# or
npm run docker:down
```

### View logs
```bash
docker-compose logs -f
# or for specific service
docker-compose logs -f nextjs
docker-compose logs -f postgres
# or
npm run docker:logs
```

### Rebuild containers
```bash
docker-compose build
# or
npm run docker:build
```

### Access database
```bash
docker-compose exec postgres psql -U postgres -d landing_page_db
```

### Run Prisma commands
```bash
# Generate Prisma Client
docker-compose exec nextjs npx prisma generate

# Push schema changes
docker-compose exec nextjs npx prisma db push

# Create migration
docker-compose exec nextjs npx prisma migrate dev

# Open Prisma Studio
docker-compose exec nextjs npx prisma studio
```

### Execute commands in Next.js container
```bash
docker-compose exec nextjs <command>
# Example:
docker-compose exec nextjs npm install
docker-compose exec nextjs npm run lint
```

## Auto-Start Configuration

The `restart: unless-stopped` policy in `docker-compose.yml` ensures that containers will automatically start when Docker starts (e.g., after system reboot).

To ensure Docker starts automatically:
- **Windows**: Docker Desktop should start automatically if configured in settings
- **macOS**: Docker Desktop should start automatically if configured in settings
- **Linux**: Enable Docker service:
  ```bash
  sudo systemctl enable docker
  sudo systemctl start docker
  ```

## Troubleshooting

### Port already in use
If port 3000 or 5432 is already in use, change the ports in `.env`:
```env
NEXTJS_PORT=3001
POSTGRES_PORT=5433
```

### Database connection errors
1. Ensure PostgreSQL container is healthy:
   ```bash
   docker-compose ps
   ```
2. Check PostgreSQL logs:
   ```bash
   docker-compose logs postgres
   ```
3. Verify DATABASE_URL in `.env` matches the container configuration

### Prisma Client errors
Regenerate Prisma Client:
```bash
docker-compose exec nextjs npx prisma generate
```

### Container won't start
1. Check logs:
   ```bash
   docker-compose logs nextjs
   ```
2. Rebuild containers:
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Reset everything
```bash
# Stop and remove containers, volumes, and networks
docker-compose down -v

# Rebuild and start fresh
docker-compose up -d --build
```

## Production Deployment

For production, use the production Dockerfile:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

Note: You'll need to create `docker-compose.prod.yml` with production-specific configurations.

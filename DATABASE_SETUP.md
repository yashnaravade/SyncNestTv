# 🗄️ Database Setup Guide

## Overview

StreamTogether uses PostgreSQL for persistent data storage and Redis for caching and real-time features. Both services are configured via Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL 15 and Redis 7 images available locally (will be pulled automatically)

## Database Schema

The Prisma schema includes:

- **User**: Registered users with authentication
- **Room**: Streaming room sessions
- **RoomMember**: Room membership with roles (OWNER, CO_HOST, VIEWER)
- **RefreshToken**: JWT refresh token management with expiry and revocation tracking

## Getting Started

### 1. Start the Docker Services

```bash
docker compose up -d
```

This will start:
- PostgreSQL on `localhost:5432` (user: `syncnesttv`, password: `syncnesttv_dev_password`)
- Redis on `localhost:6379`

### 2. Run Prisma Migrations

```bash
cd apps/api
pnpm prisma:migrate
```

This will apply all migrations and create the database schema.

### 3. Generate Prisma Client

```bash
pnpm prisma:generate
```

This generates TypeScript types based on your schema.

## Environment Variables

The database connection is configured via `.env.local` in the root directory:

```env
DATABASE_URL="postgresql://syncnesttv:syncnesttv_dev_password@localhost:5432/syncnesttv_db?schema=public"
REDIS_URL="redis://localhost:6379"
```

## Prisma Commands

```bash
# Run migrations
pnpm prisma:migrate

# Generate Prisma Client
pnpm prisma:generate

# Open Prisma Studio (interactive UI)
cd apps/api && npx prisma studio

# Check schema syntax
cd apps/api && npx prisma format

# View database
cd apps/api && npx prisma db pull
```

## Stopping Services

```bash
docker compose down
```

To remove all data:

```bash
docker compose down -v
```

## Troubleshooting

### Database Connection Failed

Ensure PostgreSQL container is healthy:

```bash
docker compose ps
docker compose logs postgres
```

### Prisma Migration Errors

Check for pending migrations:

```bash
cd apps/api && npx prisma migrate status
```

Reset the database (development only):

```bash
cd apps/api && npx prisma migrate reset
```

### Schema Out of Sync

Regenerate the Prisma Client:

```bash
cd apps/api && pnpm prisma:generate
```

# Trading Platform

A production-oriented market intelligence and F&O analytics platform for Indian markets. The application is being built in controlled phases from the Version 1.2 product specification.

## Phase 1 status

The current phase establishes the Next.js application foundation only:

- Next.js App Router with strict TypeScript
- Tailwind CSS v4 and a dark trading-terminal shell
- ESLint and Prettier
- PostgreSQL/Prisma connection boundary and health checks
- No live market-data provider
- No fabricated market data or scanner signals
- No scanner business logic or production domain tables yet

## Getting started

Requirements: Node.js and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`DATABASE_URL` is required only when using the database health endpoint:

- `/api/health` checks the web service
- `/api/health/db` checks PostgreSQL through Prisma

The database endpoint returns `503` until a reachable PostgreSQL instance is configured. No database is created or mutated by the health check.

## Authentication foundation

Authentication uses server-side bcrypt password hashing and opaque, database-backed sessions. The session token is stored only in an HTTP-only, same-site cookie; only its SHA-256 hash is persisted in PostgreSQL. Passwords and hashes are never returned to the browser.

Available flows:

- `/register` creates a user with the default `USER` role.
- `/login` creates a revocable session.
- `/dashboard` and `/profile` are protected by the Next.js `proxy.ts` gate and server-side session validation.
- `/api/auth/logout` revokes the current session.
- `/profile` provides basic timezone, theme and display-name settings.
- `ADMIN` and `USER` roles are present in the Prisma schema for future authorization rules.

Password reset storage has a server-only boundary and single-use token model. Email delivery and the reset-consume endpoint are intentionally deferred until an external email provider is selected; no fake reset email is sent.

Apply the migration in a configured development database with:

```bash
npx prisma migrate deploy
```

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run format:check
npm run test
npm run build
npm run db:generate
npm run db:validate
```

## Architecture direction

The web application remains the frontend boundary. The specification calls for a separate Node.js/NestJS API/services boundary, PostgreSQL with Prisma, and a server-side realtime gateway. Those services and market-data adapters will be introduced in later approved phases.

Market data must be supplied through a replaceable provider adapter. Development mock mode, if needed later, will remain explicitly separate from licensed production data. Scanner calculations will remain outside React components and will be implemented independently in later phases.

## Phase 3 data foundation

Phase 3 adds the backend/data contracts without connecting a live provider or inventing market data:

- normalized exchanges, instruments, memberships and dynamic derivative contracts
- quote and historical-candle contracts with explicit source/freshness fields
- India market-session state and database-backed holiday-calendar boundary
- replaceable market-data provider interface
- retry and provider-not-configured boundaries
- instrument, session and readiness API foundations

Option strikes are represented by the actual contract records and are not generated from hard-coded intervals. Provider-specific response shapes remain behind the adapter boundary.

The Phase 3 Prisma migration is applied with the existing migration workflow:

```bash
npx prisma migrate deploy
```

## Repository guide

```text
app/          Next.js routes, layouts, error/loading states and health endpoints
src/components/Reusable UI and application-shell components
src/lib/       Shared utilities and environment boundaries
src/server/    Server-only services, including the Prisma boundary
prisma/        Prisma schema and future migrations
docs/          Product requirements and developer handoff
public/        Static assets
```

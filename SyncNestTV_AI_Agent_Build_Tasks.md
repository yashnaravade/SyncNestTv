# StreamTogether — AI Agent Master Task Breakdown

**Purpose:** This document is designed to act as a sequential state-tracker and context-preserver for an AI coding agent. It breaks down the StreamTogether v2.0 master plan into isolated, executable tasks.

## 🤖 Instructions for AI Agent

1. **Context Check:** Always refer to the Tech Stack and Architecture rules before writing code.
2. **Sequential Execution:** Do not jump ahead. Complete tasks in order. A task is not complete until it is tested and functional.
3. **Task Scoping:** When starting a session, identify the first `[ ]` (incomplete) task. Propose the exact files to be created/modified to the user before generating massive blocks of code.
4. **State Management:** Once a task is complete, ask the user to update this file to mark it as `[x]`.

---

## 🏗️ Core Tech Stack Context

- **Monorepo:** Turborepo + pnpm workspaces
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Zustand, Framer Motion
- **Backend:** NestJS, TypeScript, Prisma ORM
- **Database/Cache:** PostgreSQL 15, Redis 7
- **Realtime/Voice:** Socket.IO, LiveKit (React SDK & Server)
- **Media:** HLS.js / Video.js, Proxied Jellyfin API

---

## 📋 Task Breakdown & Progress Tracker

### Phase 1: Foundation & Monorepo Setup

- [x] **T01: Initialize Monorepo**
  - _Action:_ Set up Turborepo with `apps/web` (Next.js) and `apps/api` (NestJS). Configure `pnpm-workspace.yaml`.
  - _Validation:_ Both apps build and run via `pnpm dev` from the root.
- [x] **T02: NestJS Initialization**
  - _Action:_ Set up basic NestJS structure in `apps/api`. Add global exception filters and validation pipes.
  - _Validation:_ `http://localhost:3001/api` returns a health check response.
- [ ] **T03: Database & Prisma Setup**
  - _Action:_ Create `docker-compose.yml` for Postgres and Redis. Set up Prisma schema with `User`, `Room`, `RoomMember`, and `RefreshToken`.
  - _Validation:_ Prisma migrations run successfully against the local Docker Postgres instance.

### Phase 2: Core Backend - Auth & Rooms

- [ ] **T04: Auth Module**
  - _Action:_ Implement `AuthModule` (JWT issuance, refresh token rotation via HttpOnly cookies, password hashing via bcrypt). Implement `POST /auth/register` and `POST /auth/login`.
  - _Validation:_ Successfully register a user, login, and refresh a token via Postman/cURL.
- [ ] **T05: Rooms Module**
  - _Action:_ Implement `RoomsModule` with CRUD operations. Add logic for assigning `RoomRole` (Owner, Co-host, Viewer).
  - _Validation:_ Create a room, fetch room details, and add a user to a room.
- [ ] **T06: Room Invites System**
  - _Action:_ Generate unique, human-readable room codes (`adjective-noun-4digits`). Implement invite validation and expiry logic.
  - _Validation:_ Join a room using a generated code.

### Phase 3: Real-Time Infrastructure (Socket.IO)

- [ ] **T07: Socket.IO Gateway Setup**
  - _Action:_ Integrate Socket.IO into NestJS. Configure the Redis adapter (`ioredis`) for multi-instance scaling. Add JWT authentication middleware to sockets.
  - _Validation:_ Client can connect to `/sync` namespace and authenticate.
- [ ] **T08: Presence Module**
  - _Action:_ Track online/offline status using Redis. Emit `presence:join` and `presence:leave` events.
  - _Validation:_ Connect 2 socket clients; both receive correct presence updates.
- [ ] **T09: Chat Module**
  - _Action:_ Implement `/chat` namespace. Handle `chat:message` events, persist to Postgres, and emit back to room. Add typing indicators.
  - _Validation:_ Real-time text chat works between two connected clients.

### Phase 4: Frontend Foundations

- [ ] **T10: Next.js UI Initialization**
  - _Action:_ Set up Next.js app router. Install Tailwind, shadcn/ui base components, and Lucide icons. Set up standard layout wrappers.
  - _Validation:_ Blank landing page renders with correct styling/fonts.
- [ ] **T11: Auth Pages & State**
  - _Action:_ Create Zustand store for user auth. Build `/login` and `/register` pages. Build fetch interceptors to handle token refreshes automatically.
  - _Validation:_ Can log in via UI and session persists across reloads.
- [ ] **T12: Room Management UI**
  - _Action:_ Build dashboard to list active rooms. Create "Create Room" modal and `/rooms/[code]` lobby view.
  - _Validation:_ User can create a room from the UI and be redirected to the lobby.

### Phase 5: Jellyfin Integration

- [ ] **T13: Jellyfin Config UI**
  - _Action:_ Build settings page for user to input Jellyfin Server URL, API Key, and User ID.
  - _Validation:_ Credentials save successfully to backend database.
- [ ] **T14: Jellyfin Module (Backend Proxy)**
  - _Action:_ Build NestJS `JellyfinModule`. Implement AES-256 encryption/decryption for API keys.
  - _Validation:_ Keys are stored encrypted in the DB and decrypted in memory during requests.
- [ ] **T15: Media Proxy Endpoints**
  - _Action:_ Implement `GET /api/media/library` (proxies Jellyfin `/Items`) and `GET /api/media/:id`.
  - _Validation:_ Frontend can fetch and display a grid of movies/shows from the connected Jellyfin server.
- [ ] **T16: Stream URL Generation**
  - _Action:_ Implement `POST /api/media/:id/stream` to generate a direct proxied playback URL without exposing the Jellyfin API key.
  - _Validation:_ HLS/stream URL successfully returns a playable manifest.

### Phase 6: Sync Engine & Video Player (CRITICAL PATH)

- [ ] **T17: Video Player Component**
  - _Action:_ Integrate `hls.js` or `video.js` into Next.js. Build custom UI controls (play, pause, seek, volume, subtitle toggle).
  - _Validation:_ Player can stream the URL from T16 natively in the browser.
- [ ] **T18: Sync Engine Package (Logic)**
  - _Action:_ Create `packages/sync-engine`. Implement drift calculation, reconciler (rate adjust vs. hard seek), and host authority logic.
  - _Validation:_ Unit tests pass for drift calculation (>300ms adjust rate, >1s hard seek).
- [ ] **T19: Sync Gateway (Backend)**
  - _Action:_ Implement heartbeat listener in NestJS (`sync:heartbeat`). Store authoritative playback state in Redis. Handle host disconnects & elections.
  - _Validation:_ Backend correctly maintains room playback state in Redis.
- [ ] **T20: Sync Hook (Frontend)**
  - _Action:_ Build `useSync` custom hook to wire the Video Player (T17) to the Sync Gateway (T19). Emit heartbeats every 2s.
  - _Validation:_ Two browser windows playing the same video stay within 300ms of each other.
- [ ] **T21: Sync Polish & Buffering**
  - _Action:_ Implement `sync:buffer:start` and `sync:buffer:end`. Build dev overlay showing drift latency.
  - _Validation:_ If Client A buffers, Client B automatically pauses until Client A catches up.

### Phase 7: Voice Integration

- [ ] **T22: Voice Module Backend**
  - _Action:_ Implement LiveKit token generation in NestJS (`POST /api/voice/token`). Assign correct room permissions.
  - _Validation:_ Endpoint returns a valid LiveKit JWT.
- [ ] **T23: Voice Hook Frontend**
  - _Action:_ Integrate `@livekit/components-react`. Build `useVoice` hook for room connection and audio track subscription.
  - _Validation:_ Two users in a room can hear each other.
- [ ] **T24: Voice UI Elements**
  - _Action:_ Build speaking indicators (pulsing avatars), mute/unmute buttons, and per-user volume sliders.
  - _Validation:_ Avatar correctly highlights when a user speaks.

### Phase 8: Queue & UI Polish

- [ ] **T25: Queue Backend & Sockets**
  - _Action:_ Implement `QueueModule` for adding/removing items. Sync queue state via Socket.IO.
  - _Validation:_ Adding a queue item reflects instantly on all connected clients.
- [ ] **T26: Queue Frontend UI**
  - _Action:_ Build draggable/sortable queue panel in the watch room sidebar.
  - _Validation:_ Users can drag and drop items; changes sync globally.
- [ ] **T27: UI Polish & Theming**
  - _Action:_ Add Framer Motion transitions, dark/light theme toggle, loading skeletons, and toast notifications for system events (e.g., "User left").
  - _Validation:_ UI feels cinematic, smooth, and handles async states gracefully.
- [ ] **T28: Progressive Web App (PWA)**
  - _Action:_ Configure `next-pwa`, add `manifest.json`, offline fallback page, and mobile-optimized layouts for the watch room.
  - _Validation:_ App can be "Installed" via Chrome/Safari on mobile and looks correct.

### Phase 9: Deployment

- [ ] **T29: Dockerization for Production**
  - _Action:_ Write multi-stage Dockerfiles for Next.js and NestJS. Create `docker-compose.prod.yml`.
  - _Validation:_ Containers build successfully and images are optimized for size.
- [ ] **T30: Nginx & Final Hardening**
  - _Action:_ Configure Nginx reverse proxy with WebSocket support and increased timeouts. Test rate limiters.
  - _Validation:_ App is fully accessible via proxy, websockets connect without falling back to long-polling, and media streams correctly.

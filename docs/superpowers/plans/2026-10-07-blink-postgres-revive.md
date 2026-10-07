# Blink Postgres Revive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revive Blink chat on single Koyeb Eco service with Koyeb Postgres v18, no MongoDB, all features working, fast and practical, rebranded IOP/Blink.

**Architecture:** Express monolith serves Vite build from backend/public; Prisma ORM replaces Mongoose with UUID ids mapped to `_id` in API responses to avoid frontend churn; Socket.io in-memory presence (single instance, no Redis).

**Tech Stack:** Node 20, Express 4, Socket.io 4, Prisma 6 + Postgres 18, React 18 + Vite 5, Cloudinary, JWT+bcrypt.

**Spec:** Brainstorm chat 2026-10-07 — fresh start on koyebdb, single Eco 512MB/0.1vCPU/2GB, all features real (DMs, workspaces/channels, polls/resources, friendships, notifications, presence/typing), fast+practical, company IOP app Blink.

## Global Constraints

- Fresh start: no Mongo data migration, empty Postgres schema via `prisma migrate deploy`.
- Single Koyeb Web Service: Dockerfile builds frontend into backend/public, serves API + static.
- API shape stable: return `_id` string (UUID) so frontend types keep working.
- No placeholders: CallsView or any dead UI either works or is removed.
- Company IOP, app Blink everywhere (manifest id com.iop.blink, titles, README, CORS).
- Never commit secrets: only `.env.example` templates, `DATABASE_URL` via Koyeb env.
- Eco-safe: Prisma pool connection_limit=5, pagination default 30, compression + etag.

## Review Focus

- Sidebar with 10k messages still returns <300ms and only 30 rows — paginated aggregation, not full scan.
- Opening a 2000-message DM virtualizes and scrolls without jank — memoized rows, no per-pixel setState.
- Invalid/expired JWT returns 401 JSON without crashing frontend interceptor or full reload loop.
- Workspace channel send from non-member is rejected 403 both via REST and socket broadcast.
- Poll double-vote by same user does not duplicate votes under concurrent requests.

---

### Task 1: Prisma foundation + Postgres client + env templates

**Files:**
- Create: `backend/prisma/schema.prisma`
- Create: `backend/src/lib/prisma.ts`
- Modify: `backend/src/lib/db.ts`
- Modify: `backend/package.json`
- Modify: `backend/.env.example`
- Modify: `.env.example`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: `prisma` client (`import { prisma } from ../lib/prisma.js`), `connectDB(): Promise<void>`, `DATABASE_URL` env, `toId(id:string)` + `toResponse(doc)` helpers mapping `id` -> `_id`.

- [ ] **Step 1: Add deps prisma, @prisma/client, compression + types**

Run: `npm install prisma @prisma/client compression --prefix backend && npm install -D @types/compression --prefix backend`
Expected: PASS, package.json updated.

- [ ] **Step 2: Write prisma/schema.prisma covering 11 models**

Models: User, Message, Friendship, Group, Community, Workspace, Channel, WorkspaceMessage, WorkspacePoll (+PollOption +PollVote or Json), WorkspaceResource, Notification, ScheduledMessage. UUID `id @default(uuid())`, indexes matching old Mongoose indexes, Json for reactions/pushSubscription/chatSettings/lockPins, timestamps.

- [ ] **Step 3: Write backend/src/lib/prisma.ts exporting singleton PrismaClient**

- [ ] **Step 4: Rewrite backend/src/lib/db.ts to $connect prisma, remove mongoose**

- [ ] **Step 5: Update backend/.env.example + .env.example to DATABASE_URL template**

Template keys: DATABASE_URL, DIRECT_URL (optional), JWT_SECRET, PORT, NODE_ENV, FRONTEND_URL, CLOUDINARY_*, HELP_CENTER_*, VAPID_*, VITE_VAPID_PUBLIC_KEY, VITE_HELP_CENTER_EMAIL, VITE_API_URL (relative). Remove MONGODB_URL.

- [ ] **Step 6: Verify generate**

Run: `npx prisma validate --schema backend/prisma/schema.prisma && npx prisma format --schema backend/prisma/schema.prisma`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/prisma/schema.prisma backend/src/lib/prisma.ts backend/src/lib/db.ts backend/package.json backend/.env.example .env.example
git commit -m "feat: add Prisma Postgres foundation replacing Mongoose"
```

### Task 2: Auth + users on Prisma + sidebar perf fix

**Files:**
- Modify: `backend/src/models/user.model.ts` (delete, replace with prisma queries — keep file as deprecation shim or remove)
- Modify: `backend/src/controllers/auth.controller.ts`
- Modify: `backend/src/middleware/auth.middleware.ts`
- Modify: `backend/src/lib/utils.ts` (drop mongoose Types)
- Modify: `backend/src/types/index.ts` (Types.ObjectId -> string)
- Test: `backend/src/routes/auth.route.ts` manual via curl

**Interfaces:**
- Consumes: `prisma` from Task 1
- Produces: `signup, login, logout, updateProfile, checkAuth` same route paths + `_id` in JSON, cookie `jwt` + Bearer both work.

- [ ] **Step 1: Rewrite auth.middleware protectRoute with prisma.user.findUnique**

- [ ] **Step 2: Rewrite auth.controller signup/login to prisma + bcrypt + generateToken(string)**

- [ ] **Step 3: Rewrite getUsersForSidebar to single aggregation (last message per peer, limit 50, no populate full scan)**

SQL approach: distinct conversation peers via UNION of sent/received, LEFT JOIN LATERAL last message, paginate.

- [ ] **Step 4: Manual verify**

Run: `npm run dev --prefix backend` with local DATABASE_URL, `curl POST /api/auth/signup`, `curl GET /api/messages/users` with cookie.
Expected: 201 + 200 JSON with `_id`.

- [ ] **Step 5: Commit**

### Task 3: Messages DMs on Prisma + pagination

**Files:**
- Modify: `backend/src/controllers/message.controller.ts` (largest, split if needed)
- Modify: `backend/src/routes/message.route.ts`

**Interfaces:**
- Consumes: auth middleware, prisma
- Produces: `GET /api/messages/:id?limit=30&cursor=` , `POST /send/:id` , reactions, edit, delete, pin, search — all paginated.

- [ ] **Step 1: Rewrite getMessages with cursor pagination (take 30, order desc)**

- [ ] **Step 2: Rewrite send/edit/delete/react/pin to prisma + socket emit**

- [ ] **Step 3: Verify with two test users exchanging 40 messages, cursor page 2 works**

- [ ] **Step 4: Commit**

### Task 4: Workspaces/channels/polls/resources/friendships/notifications

**Files:**
- Modify: `backend/src/controllers/workspace.controller.ts`, `friendship.controller.ts`, `notification.controller.ts`, `workspace-pin.ts`, `workspace-thread.ts`
- Modify: `backend/src/services/notification.service.ts`

- [ ] **Step 1: Rewrite workspace CRUD + channels as Prisma Channel model**

- [ ] **Step 2: Rewrite workspace messages with pagination + thread counts**

- [ ] **Step 3: Rewrite polls (Poll + Option + Vote tables to prevent double-vote race via @@unique)**

- [ ] **Step 4: Rewrite friendships with @@unique(requester,receiver)**

- [ ] **Step 5: Rewrite notifications with index on (recipient,isRead)**

- [ ] **Step 6: Commit**

### Task 5: Monolith hardening for Eco (compression, health, Dockerfile, socket CORS)

**Files:**
- Modify: `backend/src/index.ts`
- Modify: `backend/src/lib/socket.ts`
- Modify: `Dockerfile`
- Modify: `backend/package.json` scripts

- [ ] **Step 1: Add compression, etag, /api/health, trust proxy, tighten rate limits for 0.1vCPU**

- [ ] **Step 2: Update Dockerfile to prisma generate + migrate deploy + node --max-old-space-size=400**

- [ ] **Step 3: Verify `docker build` serves frontend from /backend/public + /api/health 200**

- [ ] **Step 4: Commit**

### Task 6: Frontend fast + practical + IOP/Blink rebrand + axios fix

**Files:**
- Modify: `frontend/src/lib/axios.ts`
- Modify: `frontend/src/components/MessageVirtualizer.tsx`
- Modify: `frontend/src/components/MessageItem.tsx`
- Modify: `frontend/index.html`, `frontend/public/manifest.webmanifest`, `frontend/vite.config.js`, `frontend/README.md`, `README.md`
- Modify or Delete: `frontend/src/components/CallsView.tsx` (remove if placeholder)

**Interfaces:**
- Consumes: stable API `_id` shape
- Produces: relative `/api` baseURL, memoized virtual list, IOP branding.

- [ ] **Step 1: Fix axios to relative /api, remove require(), handle 401 via store not location.href loop**

- [ ] **Step 2: Fix MessageVirtualizer to avoid per-pixel setState (rAF throttle, memo rows)**

- [ ] **Step 3: Rebrand sweep com.iop.blink, Blink by IOP, titles, og tags**

- [ ] **Step 4: Remove or wire placeholder CallsView — no dead buttons**

- [ ] **Step 5: Build frontend, confirm no TS errors**

Run: `npm run build --prefix frontend`
Expected: PASS dist/.

- [ ] **Step 6: Commit**

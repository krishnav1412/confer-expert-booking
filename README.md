# Confer — Production-Ready Expert Marketplace

A complete MERN-stack SaaS marketplace for booking 1:1 sessions with vetted experts. Built for India (INR pricing, real-time slots), with full auth, role-based access, real-time messaging, payments, transactional email, file uploads, an admin moderation panel, and one-click deployment.

> **One account, both sides.** Members browse, book, message, and review. Approved experts use the same account to manage services and availability. Admins moderate the whole platform.

---

## Table of contents

1. [What's inside](#whats-inside)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Quick start (local)](#quick-start-local)
5. [Quick start (Docker)](#quick-start-docker)
6. [Demo credentials](#demo-credentials)
7. [Environment variables](#environment-variables)
8. [API reference](#api-reference)
9. [Real-time](#real-time)
10. [Security](#security)
11. [Deployment](#deployment)
12. [Migration & seeding](#migration--seeding)
13. [Known limitations](#known-limitations)
14. [Roadmap](#roadmap)

---

## What's inside

### Auth & accounts
- JWT auth with bcrypt password hashing, persistent sessions, automatic 401 handling
- Forgot-password / reset-password flow with hashed tokens, 60-min TTL, enumeration-safe
- Roles: `user`, `expert`, `admin` with granular middleware (`requireAuth`, `requireExpert`, `requireRole`)
- Account suspension, soft-delete with PII scrub for ledger integrity
- Unified account system — same account can be member, expert (post-approval), or admin

### Marketplace
- Featured-first ordering with promoted slot for paid boosts
- Trending categories with live counts and ratings
- Filters: search, category, sort, min rating, min experience, max price
- Indian localisation — INR pricing, real Indian companies (Razorpay, CRED, Swiggy, Zomato, …)

### Booking
- Service-aware booking with price/duration snapshots at booking time
- Database-level double-booking prevention via partial unique index excluding cancelled bookings
- Real-time slot updates over Socket.io
- Booking buffer hours and per-day max bookings enforced server-side
- Lifecycle: `Pending → Confirmed → Completed | Cancelled` with notifications & emails

### Payments (Razorpay)
- Order/payment models with HMAC signature verification
- Mock mode for local dev (no keys → auto-success)
- Live mode: invokes Razorpay Checkout in the browser, verifies signature server-side
- **Razorpay webhook listener** at `/api/webhooks/razorpay` with idempotent payment-state transitions
- Promotion plans (weekly / monthly featured) as paid expert boost

### Messaging
- Account-to-account inbox, per-role unread counters, read receipts
- Role switcher for users who are also experts
- Persistent conversations, ownership-checked at every endpoint

### Reviews
- Reviews tied to completed bookings (verified flag), one per user per booking
- Expert can reply; ratings recompute on insert/delete; admin can moderate

### Dashboards
- **User:** upcoming/completed/all bookings, total spend, favourites, leave-review CTA
- **Expert:** revenue, KPIs, unique clients, profile views, pending vs completed, inbox preview, integrated promotion flow
- **Admin:** stats overview, applications queue, user/expert moderation, booking inspection, review moderation
- **Settings:** profile editor, password change, notification preferences, **avatar upload**
- **Expert settings:** profile, services, availability editor with weekly toggle grid + blocked dates

### Notifications
- DB-backed in-app notifications with bell + dropdown, 30s polling, mark-read
- Triggered on booking lifecycle, message receipt, payments, review receipt, expert approval/rejection

### Transactional email
- Provider-abstracted (console/SMTP/noop adapters)
- Templates: welcome, booking confirmed, booking cancelled, expert approved, expert rejected, password reset
- Branded HTML wrapper with CTAs

### File uploads
- Provider-abstracted (local filesystem / Cloudinary)
- 5MB cap, MIME whitelist (PNG/JPEG/WebP/GIF), multer in-memory with streamed upload
- Avatar upload mirrors to expert profile when applicable

### SEO
- Open Graph + Twitter Cards meta tags
- Dynamic `/sitemap.xml` listing all non-suspended experts
- `/robots.txt` allowing public pages, disallowing dashboards & admin

### UX
- Premium dark mode with FOUC prevention
- Skeleton loaders, optimistic updates, debounced search, toast notifications
- Responsive across desktop, tablet, mobile
- Hand-tuned typography, spacing, and motion

---

## Tech stack

**Frontend** — React 18 (Vite), React Router DOM v6, TanStack Query v5, React Hook Form + Zod, Tailwind CSS, Axios, Socket.io-client, react-hot-toast.

**Backend** — Node.js + Express, MongoDB + Mongoose, Socket.io, Zod, jsonwebtoken, bcryptjs, express-rate-limit, helmet, express-mongo-sanitize, multer, CORS, Morgan.

**Optional** — nodemailer (SMTP email), cloudinary (cloud storage).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  React 18 + Vite frontend                                       │
│                                                                 │
│  AuthContext → Axios client (Bearer JWT)                        │
│       ↓             ↓                                           │
│  ProtectedRoute   TanStack Query    Socket.io client (auth)     │
│       ↓             ↓                       ↓                   │
│  Pages (Public · Auth · Expert · Admin)                         │
└────────────────┬────────────────────────────────────────────────┘
                 │ HTTPS / WSS
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│  Express API + Socket.io                                        │
│                                                                 │
│  helmet · cors · rate-limit · mongo-sanitize · morgan           │
│       ↓                                                         │
│  /api/auth      /api/users     /api/experts                     │
│  /api/bookings  /api/messages  /api/reviews                     │
│  /api/payments  /api/applications /api/notifications            │
│  /api/admin     /api/uploads      /api/webhooks/razorpay        │
│  /robots.txt    /sitemap.xml                                    │
│       ↓                                                         │
│  authMiddleware · requireRole · zod validation · ownership      │
│       ↓                                                         │
│  Controllers → services (email, storage) → Mongoose models      │
└────────────────┬────────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│  MongoDB (Atlas / local)                                        │
│  Users · Experts · Bookings · Reviews · Conversations           │
│  Notifications · Payments · Promotions · ExpertApplications     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick start (local)

### Prerequisites
- Node.js 18+
- MongoDB (local install or Atlas free tier)

```bash
git clone <your-repo> confer && cd confer

# Backend
cd backend
cp .env.example .env                      # edit MONGO_URI + JWT_SECRET
npm install
npm run seed                              # creates 17 accounts (1 customer, 1 admin, 15 experts)
npm run dev                               # → http://localhost:5000

# Frontend (new terminal)
cd ../frontend
cp .env.example .env
npm install
npm run dev                               # → http://localhost:5173
```

> **Windows:** use `127.0.0.1` (not `localhost`) in `MONGO_URI`. Use `Copy-Item .env.example .env` in PowerShell.

---

## Quick start (Docker)

The repo ships with a `docker-compose.yml` that spins up MongoDB + the backend in two containers. The frontend you run separately (`npm run dev`) or deploy to Vercel.

```bash
docker compose up --build
# In another terminal:
cd frontend && npm install && npm run dev
```

To rebuild only the backend image after code changes:

```bash
docker compose up --build backend
```

---

## Demo credentials

After `npm run seed`:

| Role | Email | Password |
|---|---|---|
| Customer | `demo@confer.test` | `Demo12345` |
| Admin | `admin@confer.test` | `Admin12345` |
| Expert (any of 15) | `<firstname>.<lastname>@confer.test`<br>e.g. `priya.nair@confer.test` | `Expert12345` |

All 15 experts share `Expert12345`. The login page has one-tap demo fill buttons in dev mode.

**Full expert list:** Aarav Mehta · Priya Nair · Rohan Kapoor · Ananya Sen · Arjun Malhotra · Ishita Verma · Vikram Iyer · Maya Krishnan · Karan Shetty · Anika Reddy · Devansh Agarwal · Nidhi Sharma · Siddharth Rao · Tanvi Bhatt · Yashvi Gupta.

---

## Environment variables

### `backend/.env`

#### Core (required)

| Variable | Example |
|---|---|
| `PORT` | `5000` |
| `NODE_ENV` | `development` / `production` |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/confer` or Atlas URI |
| `CLIENT_URL` | `http://localhost:5173` (comma-separated for multi-origin CORS) |
| `PUBLIC_APP_URL` | `http://localhost:5173` (used in emails & sitemap) |
| `JWT_SECRET` | long random string — `openssl rand -hex 64` |
| `JWT_EXPIRES_IN` | `7d` (default) |
| `BCRYPT_ROUNDS` | `10` (default) |

#### Payments (optional — mock mode if blank)

| Variable | Notes |
|---|---|
| `RAZORPAY_KEY_ID` | from Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | from Razorpay dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | falls back to `RAZORPAY_KEY_SECRET` if unset |

#### Email (optional — console adapter if blank)

| Variable | Notes |
|---|---|
| `EMAIL_PROVIDER` | `console` (default) / `smtp` / `noop` |
| `EMAIL_FROM` | `Confer <no-reply@confer.app>` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` | required when `EMAIL_PROVIDER=smtp` |

For Resend: host `smtp.resend.com`, user `resend`, pass `<api-key>`. For SendGrid: host `smtp.sendgrid.net`, user `apikey`, pass `<api-key>`.

#### Storage (optional — local adapter if blank)

| Variable | Notes |
|---|---|
| `STORAGE_PROVIDER` | `local` (default) / `cloudinary` |
| `UPLOAD_ROOT` | `./uploads` (local adapter only) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | required when `cloudinary` |

> Use `cloudinary` for multi-instance deployments. The `local` adapter writes to the container filesystem, which doesn't survive restarts on most PaaS unless backed by a persistent disk.

### `frontend/.env`

| Variable | Example |
|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | `http://localhost:5000` |

---

## API reference

All responses: `{ success, data, message? }`. Errors: `{ success: false, message, errors? }` with proper HTTP codes. Auth endpoints require `Authorization: Bearer <token>`.

### Public

| Method | Path |
|---|---|
| GET | `/api/health` |
| POST | `/api/auth/signup` |
| POST | `/api/auth/login` |
| POST | `/api/auth/forgot-password` |
| POST | `/api/auth/reset-password` |
| GET | `/api/experts` `?search&category&sort&page&limit&featured&minRating&minExp&maxPrice` |
| GET | `/api/experts/featured` |
| GET | `/api/experts/categories` |
| GET | `/api/experts/:id` |
| GET | `/api/reviews?expertId&sort` |
| GET | `/robots.txt` |
| GET | `/sitemap.xml` |
| POST | `/api/webhooks/razorpay` (signed, idempotent) |

### Authenticated user

| Method | Path |
|---|---|
| GET / POST | `/api/auth/me`, `/api/auth/logout` |
| PATCH | `/api/users/me` (profile) |
| POST | `/api/users/me/change-password` |
| GET / POST | `/api/users/me/favorites`, `/api/users/me/favorites/:expertId` |
| POST | `/api/users/me/recently-viewed/:expertId` |
| GET / POST / PATCH | `/api/bookings/me`, `/api/bookings`, `/api/bookings/:id/status` |
| GET / POST | `/api/messages/conversations`, `/api/messages/conversations/:id`, `/api/messages/conversations/:id/reply`, `/api/messages/conversations/:id/read` |
| POST / GET | `/api/applications`, `/api/applications/me` |
| POST | `/api/reviews`, `/api/reviews/:id/reply` |
| POST | `/api/payments/booking-order`, `/api/payments/verify`, `/api/payments/promotion` |
| GET / POST | `/api/notifications`, `/api/notifications/read-all`, `/api/notifications/:id/read` |
| POST | `/api/uploads/avatar` (multipart) |

### Expert-only

| Method | Path |
|---|---|
| GET / PATCH | `/api/experts/me`, `/api/experts/me/availability`, `/api/experts/me/analytics` |
| GET | `/api/bookings/expert/me` |

### Admin-only

| Method | Path |
|---|---|
| GET | `/api/admin/stats` |
| GET | `/api/admin/users`, `/api/admin/users/:id` |
| POST / DELETE | `/api/admin/users/:id/suspend`, `/api/admin/users/:id/unsuspend`, `/api/admin/users/:id` |
| GET | `/api/admin/experts` |
| POST | `/api/admin/experts/:id/toggle-featured`, `/api/admin/experts/:id/suspend`, `/api/admin/experts/:id/unsuspend` |
| GET / DELETE | `/api/admin/reviews`, `/api/admin/reviews/:id` |
| GET | `/api/admin/bookings` |
| GET / POST | `/api/applications`, `/api/applications/:id/approve`, `/api/applications/:id/reject` |

---

## Real-time

Socket.io server wraps the Express HTTP server. On handshake, the client passes its JWT (soft-fail — anonymous clients can still receive slot updates).

Flow:
1. Client opens expert detail page → emits `joinExpertRoom <expertId>`
2. Server joins socket to room `expert:<id>`
3. On successful `POST /api/bookings` the server broadcasts `slotBooked` only to that room
4. Clients use TanStack Query's `setQueryData` to mark the slot booked instantly

---

## Security

- **Auth**: JWT (7-day default, configurable), bcrypt password hashing, **forgot/reset with SHA-256-hashed tokens, 60-min TTL, enumeration-safe**
- **NoSQL injection**: `express-mongo-sanitize` strips `$` and `.` from `req.body/query/params`
- **Rate limiting**: `express-rate-limit` per-route (auth: 20/15min, writes: 60/min, general: 240/min)
- **HTTP headers**: `helmet` with relaxed CORP for image cross-origin loading
- **CORS**: explicit allow-list from `CLIENT_URL` (comma-separated origins)
- **Ownership**: controller-layer ownership checks for every booking/message/review/profile mutation
- **Double-booking**: database-level partial unique index `(expertId, date, timeSlot)` excluding `Cancelled`
- **Razorpay webhook**: HMAC-SHA256 signature verification against raw request body, idempotent state transitions
- **Trust proxy**: enabled for correct IP-based rate limiting behind Render/Railway/Vercel/Cloudflare
- **Upload validation**: 5MB cap, MIME whitelist, in-memory buffer
- **Suspended accounts** cannot log in; **suspended experts** are filtered out of all public listings

---

## Deployment

### Production checklist

- [ ] `JWT_SECRET` set to a 64+ char random string (use `openssl rand -hex 64`)
- [ ] `MONGO_URI` points to Atlas (or another managed MongoDB) — IP allow-list configured
- [ ] `CLIENT_URL` and `PUBLIC_APP_URL` point to your deployed frontend
- [ ] `NODE_ENV=production`
- [ ] `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` set for live payments (otherwise mock mode)
- [ ] `EMAIL_PROVIDER=smtp` + SMTP credentials set for real emails (otherwise console)
- [ ] `STORAGE_PROVIDER=cloudinary` for multi-instance deployments (or attach a persistent disk to use `local`)
- [ ] In Razorpay dashboard → Settings → Webhooks → add `https://<your-api>/api/webhooks/razorpay` with the events `payment.captured`, `payment.failed`, `order.paid`

### Frontend → Vercel

The repo includes a `frontend/vercel.json` with SPA rewrites and cache headers.

1. Import the repo into Vercel
2. Set **Root Directory** = `frontend`
3. Vercel auto-detects Vite. Set env vars:
   - `VITE_API_URL` = `https://<your-api>.onrender.com/api`
   - `VITE_SOCKET_URL` = `https://<your-api>.onrender.com`

### Backend → Render (one-click via Blueprint)

The repo includes a root `render.yaml`.

1. Push the repo to GitHub
2. In Render → **New +** → **Blueprint** → connect the repo
3. Render reads `render.yaml`, creates the service, and prompts for the `sync: false` env vars (`MONGO_URI`, `CLIENT_URL`, `PUBLIC_APP_URL`, Razorpay keys)
4. Deploy → Render builds, runs healthchecks against `/api/health`, and serves on `https://confer-api.onrender.com`

Render's free tier doesn't keep persistent disks — set `STORAGE_PROVIDER=cloudinary` and provide Cloudinary keys, or upgrade.

### Backend → any container host (Railway, Fly, GCP Cloud Run, AWS ECS)

The `backend/Dockerfile` is multi-stage, runs as a non-root user, exposes 5000, and has a `HEALTHCHECK`. Mount a volume at `/app/uploads` if using local storage.

```bash
docker build -t confer-api ./backend
docker run -p 5000:5000 --env-file backend/.env confer-api
```

### Database → MongoDB Atlas

1. Create an M0 cluster (free tier)
2. **Network Access** → add `0.0.0.0/0` (or specific backend IPs)
3. **Database Access** → create a user
4. Copy connection string → set as `MONGO_URI`

---

## Migration & seeding

### First-time seed

```bash
cd backend && npm run seed
```

This wipes the database and creates 1 customer, 1 admin, 15 experts (with linked user accounts, services, reviews, and 7 days of availability). **Do not run in production** unless you want to wipe data.

### Schema migrations

The current schema is backward-compatible. If upgrading from earlier prototype versions:

1. **Existing users**: `passwordResetTokenHash`, `passwordResetExpiresAt`, `suspendedAt` will be `null` until used — no migration needed
2. **Existing bookings**: `meetingProvider`, `meetingUrl`, `meetingId`, `rescheduledFrom` default to safe values
3. **Existing experts**: `isSuspended` defaults to `false`
4. **New indexes**: created on first connection via `Booking.index()` and `Expert.index()` calls; check Atlas → Performance Advisor in a week to confirm

If you need to rebuild indexes after a schema change:

```js
// In a one-off Node script:
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGO_URI);
await mongoose.connection.db.collection('bookings').dropIndexes();
await mongoose.connection.db.collection('experts').dropIndexes();
// Restart server — indexes will be re-built from schema definitions
```

---

## Known limitations

| Area | Current state | Path forward |
|---|---|---|
| **Email delivery** | Console adapter by default. SMTP works but no retry/dead-letter queue. | Wire to Resend/SendGrid via SMTP, or add a job queue (BullMQ + Redis) for retries. |
| **File storage** | Local adapter writes to container disk (lost on restart unless persistent volume). | Use Cloudinary in production. Set `STORAGE_PROVIDER=cloudinary`. |
| **Video sessions** | Database fields (`meetingProvider`, `meetingUrl`) exist but no UI flow yet. | Integrate Jitsi / Google Meet / Daily.co as a Confer expert toggle. |
| **Payouts** | Revenue tracked; no auto-payout to experts. | Razorpay RazorpayX route accounts (split payments) or manual settlement weekly. |
| **Search ranking** | Mongo `$regex` search. | Migrate to Atlas Search or Meilisearch for fuzzy, ranked search. |
| **Real-time messaging** | Polling on inbox (refetch on focus + on interval). | Add Socket.io rooms per conversation for instant push. |
| **Multi-tenancy** | Single tenant. | Add `organizationId` partitioning if pivoting to B2B. |
| **i18n** | English/INR only. | Add `react-i18next`, parameterise currency. |

---

## Roadmap

### Soon
- Video session integration (Jitsi/Daily)
- Reschedule flow (DB fields exist)
- Atlas Search migration
- Per-conversation socket rooms for instant message push

### Next
- Auto-payouts via RazorpayX
- Expert verification badges (LinkedIn OAuth)
- Mobile apps (React Native, sharing the same API)
- Push notifications (web push + FCM)

### Long-term
- Group sessions / workshops
- Recorded session library
- B2B / team plans
- Analytics dashboard for experts (cohort retention, conversion funnels)

---

## License

MIT

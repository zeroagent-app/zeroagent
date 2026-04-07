# ZeroAgent Event Venue Marketplace

## Overview

ZeroAgent is Pakistan's digital marketplace for booking premium event venues (weddings, functions, large gatherings). It connects verified venue owners directly with serious clients through a role-based platform.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/zeroagent)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM (lib/db)
- **Auth**: Cookie-based session auth with bcryptjs password hashing
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Features

- Role-based access: Admin / Owner / User
- Venue browsing with filters (city, capacity, price, event type)
- Booking request flow (User sends → Owner approves/rejects)
- In-app chat unlocks after booking approval
- Admin panel: manage users, venues (approve/reject), bookings, payment status

## Seed Accounts (password: "password")

- **admin@zeroagent.pk** — Admin role
- **bilal@zeroagent.pk** — Owner role
- **sara@zeroagent.pk** — Owner role
- **ahmed@zeroagent.pk** — User role

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Architecture

### Database Schema (lib/db/src/schema/)
- `users` — id, name, email, password_hash, role (admin/owner/user), created_at
- `venues` — id, owner_id, name, description, city, address, capacity, price_per_day, event_types[], images[], status (pending/approved/rejected), created_at
- `bookings` — id, venue_id, user_id, event_date, event_type, guest_count, status, payment_status, notes, rejection_reason, created_at
- `messages` — id, booking_id, sender_id, message, created_at

### API Routes (artifacts/api-server/src/routes/)
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Current user
- `GET /api/venues` — List approved venues (with filters)
- `GET /api/venues/featured` — Featured venues
- `GET /api/venues/stats` — Platform statistics
- `GET /api/venues/my` — Owner's own venues
- `GET /api/venues/:id` — Venue detail + booked dates
- `POST /api/venues` — Create venue (owner)
- `PUT /api/venues/:id` — Update venue (owner/admin)
- `DELETE /api/venues/:id` — Delete venue (owner/admin)
- `GET /api/bookings` — List bookings (role-filtered)
- `POST /api/bookings` — Create booking request (user)
- `POST /api/bookings/:id/approve` — Approve booking (owner)
- `POST /api/bookings/:id/reject` — Reject booking (owner)
- `POST /api/bookings/:id/cancel` — Cancel booking (user)
- `PATCH /api/bookings/:id/payment` — Update payment status (admin)
- `GET /api/chat/:bookingId` — Get chat messages (approved bookings only)
- `POST /api/chat/:bookingId` — Send chat message
- `GET /api/admin/users` — All users (admin)
- `GET /api/admin/venues` — All venues (admin)
- `POST /api/admin/venues/:id/approve` — Approve venue (admin)
- `POST /api/admin/venues/:id/reject` — Reject venue (admin)
- `GET /api/admin/bookings` — All bookings (admin)
- `GET /api/admin/stats` — Dashboard stats (admin)

### Frontend Pages (artifacts/zeroagent/src/pages/)
- `/` — Home with hero, stats, featured venues, CTA
- `/venues` — Browse venues with filters
- `/venues/:id` — Venue detail + booking form
- `/login` — Login page
- `/register` — Register with role selection
- `/dashboard` — Role-based dashboard (user/owner/admin)
- `/dashboard/venue/new` — Add venue (owner)
- `/dashboard/venue/:id/edit` — Edit venue (owner)
- `/dashboard/chat/:bookingId` — Chat for approved bookings

# Machine Workshop — Product Requirements Document

## Original Problem Statement
Multi-brand two-wheeler service workshop (Ola Electric + all brands). Customers book a scooter service; the owner receives and manages orders. Owner wanted: Home page, dedicated Book Service page (name, phone, brand, model, issue, location, landmark, slot), and an Owner Dashboard to manage bookings, slots, availability and settings. Theme: Black / Yellow / White.

## Architecture
- **Frontend**: React (CRA + CRACO) + Tailwind + shadcn/ui + framer-motion. Pages: Home (`/`), Book (`/book`), Login (`/login`), Owner Dashboard (`/admin`, `/owner`, `/dashboard`). SPA with ErrorBoundary + catch-all route.
- **Backend**: FastAPI + Motor (MongoDB). All routes under `/api`. JWT auth via httpOnly cookie; lazy idempotent admin seeding (serverless-safe).
- **DB collections**: `users`, `bookings`, `slots`, `settings` (singleton `key:global`).
- **Deploy**: `vercel.json` (multi-service: frontend static build + python backend). `REACT_APP_BACKEND_URL` falls back to relative `/api`.

## User Personas
- **Customer**: books a scooter service by choosing an available slot.
- **Owner/Admin**: manages bookings, slots, availability and settings.

## Core Requirements (static)
- Public: Home, Book form with slot selection, booking creation.
- Owner: login, view/search bookings, Accept/Reject + status changes, create/remove/toggle slots, settings (availability, holiday mode, working hours, max per slot, service areas).
- Statuses: Pending, Accepted, Rejected, In Progress, Completed.
- Customers only see slots that are ON and not full; bookings blocked when unavailable or holiday mode.

## Implemented (2026-07-27)
- Home page: hero (Book Now / Call Now), brands, reviews, closed-banner, CTA.
- Book page: full form (name, phone, brand, model, issue, location, landmark, slot) + availability/holiday handling + capacity-aware slot list.
- Owner Dashboard: Bookings tab (stats, search by name/phone, Accept/Reject, status dropdown), Service Slots tab (create/remove, ON/OFF toggle), Settings tab (availability master toggle, holiday mode, working hours, max per slot, service areas).
- Backend endpoints: `/api/config`, `/api/slots/available`, `/api/bookings` (+search, stats, status), `/api/slots` CRUD, `/api/settings` GET/PUT, `/api/auth/*`, `/api/health`.
- Auth: JWT cookie + lazy admin seeding; `/api/health` diagnostics.
- Black/Yellow/White theme across all pages.
- Fixes: SPA routing blank-screen, Vercel relative API, controlled Tabs (no tab reset on mutation).
- **Tested**: backend 25/25 pass; frontend E2E critical flows verified.

## Credentials
- Admin: `admin@workshop.com` / `workshop123` (from `ADMIN_EMAIL`/`ADMIN_PASSWORD`).

## Backlog / Next
- **P1**: SMS/WhatsApp notification to owner on new booking; to customer on Accept.
- **P1**: Date-based slots (per-day availability) instead of recurring labels.
- **P2**: Clean up orphaned bookings when a slot is deleted (currently retained by design).
- **P2**: CORS allow-list/regex for multiple deploy origins.
- **P2**: Booking detail view + notes; export to CSV.
- **P2**: Change-password UI for owner.

# 🩸 Bloodline — Location-based Blood Donor Network

A full-stack, real-time blood donor network built with **Next.js 15 (App Router) + MongoDB + Node** (MERN-style, with Next.js route handlers as the API layer).
Find compatible donors near you on a live map, post emergency requests that instantly alert nearby donors, and track your donations and impact.

## ✨ Features

| Area | What it does |
| --- | --- |
| **Geo donor search** | MongoDB `2dsphere` + `$geoNear` ranks donors by real distance. Filter by blood group, *all compatible types*, radius (1–100 km) and eligibility. |
| **Emergency requests** | Post a request with hospital pin, units, urgency and deadline. Compatible, available donors within an urgency-based radius (15/25/40 km) are notified instantly. |
| **Respond & confirm** | Donors offer to help in one tap. Requesters see responders' contact details, confirm donations (which credits the donor and updates eligibility) and mark requests fulfilled or cancelled. |
| **Notifications** | In-app notification centre with live polling and toast pop-ups for new alerts. |
| **Dashboard** | Availability toggle, 90-day eligibility ring, impact stats, nearby requests you can help, local blood-group mix, 12-month donation chart, achievements. |
| **Hero board** | Leaderboard with podium, filterable by city. |
| **3D & motion** | React-Three-Fiber hero (liquid blood drop, orbiting red blood cells, bloom), interactive 3D network globe, Framer Motion everywhere: spotlight cards, tilt, magnetic buttons, tickers, marquee. |
| **Learn** | Interactive compatibility matrix and a step-by-step eligibility checker. |
| **Privacy** | Phone numbers are visible only to signed-in users. Responder phones are visible only to the requester. JWT stored in an httpOnly cookie. |

## 🧱 Tech stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Radix UI primitives (shadcn-style components), Framer Motion, React-Three-Fiber + Drei + Postprocessing, React-Leaflet (CARTO dark tiles), Recharts, SWR, Sonner
- **Backend:** Next.js route handlers (Node runtime), Mongoose 8, Zod validation, bcrypt, JOSE JWT, Edge middleware for route protection
- **Database:** MongoDB (local zero-install dev server via `mongodb-memory-server`, or MongoDB Atlas)
- **Geocoding:** OpenStreetMap Nominatim (server-side proxy, no API key)

## 🚀 Getting started

```bash
npm install

# 1) Start a local MongoDB (downloads a mongod binary on first run, data persists in ./.mongo-data)
npm run db

# 2) In another terminal, seed demo data (≈220 donors + requests around New Delhi)
npm run seed

# 3) Start the app
npm run dev
```

Open http://localhost:3000 and click **Try the demo account** on the sign-in page (`demo@bloodline.app` / `demo1234`).

> Shortcut: `npm run dev:all` runs the database and the web app together.

### Using MongoDB Atlas instead

Copy `.env.example` to `.env.local` and set `MONGODB_URI` to your Atlas connection string. Then run `npm run seed` and `npm run dev`.

### Seeding around your own city

```bash
SEED_LAT=19.076 SEED_LNG=72.8777 SEED_CITY=Mumbai npm run seed
```

## 🗂 Project structure

```
src/
  app/
    api/                 REST API (route handlers)
      auth/              register · login · logout
      me/                current user profile (GET/PATCH)
      donors/            geo search
      requests/          list/create · [id] detail/status · respond · confirm
      donations/         history + self-reported donations
      notifications/     feed + mark read
      stats/ leaderboard/ geocode/
    find/ requests/ dashboard/ profile/ heroes/ login/ register/
  components/
    ui/                  Button, Card, Input, Dialog, Select, Tabs, Switch, Slider, …
    three/               3D hero scene + globe
    map/                 Leaflet map view + location picker
    landing/ dashboard/  page sections
  lib/                   db, auth, blood compatibility, validators, client hooks
  models/                User, BloodRequest, Donation, Notification
scripts/                 local-db.mjs, seed.ts
```

## 🔌 API overview

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account (sets session cookie) |
| POST | `/api/auth/login` · `/api/auth/logout` | Session management |
| GET / PATCH | `/api/me` | Current user / update profile, location, availability |
| GET | `/api/donors?lat&lng&radius&bloodGroup&compatible=1&eligibleOnly=1` | Nearby donors sorted by distance |
| GET | `/api/requests?scope=nearby\|mine\|responded&lat&lng&radius&urgency&canHelp=1` | Requests |
| POST | `/api/requests` | Create request and alert nearby compatible donors |
| GET / PATCH | `/api/requests/:id` | Detail / set status (owner) |
| POST / DELETE | `/api/requests/:id/respond` | Offer / withdraw help |
| POST | `/api/requests/:id/confirm` | Owner confirms a donor donated |
| GET / POST | `/api/donations` | Donation history / log a donation |
| GET / PATCH | `/api/notifications` | Feed / mark read |
| GET | `/api/stats` · `/api/leaderboard` · `/api/geocode` | Public data |

## ⚕️ Disclaimer

Bloodline helps people find each other; it is not a medical service. Eligibility rules (e.g. the 90-day interval) are simplified. Always follow your blood bank's screening.

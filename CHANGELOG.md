# Phoenix Project — Development Log
> Last updated: 2026-09-20

---

## 🏗️ Project Architecture

| Layer | Tech | Location |
|---|---|---|
| Frontend | Next.js 16, React 19, TypeScript | `phoenix-project/` |
| Backend | Node.js, Express.js | `phoenix-engine/` (separate project) |
| Database | MongoDB Atlas | `phoenix_portfolio` database |
| Auth | JWT (30-day tokens), bcryptjs | `phoenix-engine/routes/auth.js` |
| Admin Panel | Next.js + Supabase (untouched) | `phoenix-project/src/app/admin/` |

---

## ✅ Stage 1 — Authentication (Done)

### What was built
- `POST /api/auth/register` — create account, bcrypt password hash (salt 12), auto-login
- `POST /api/auth/login` — JWT token response
- `GET /api/auth/me` — fetch logged-in user profile
- `PUT /api/auth/profile` — update name, phone, risk profile
- `POST /api/auth/change-password` — verify old password, re-hash new one
- `middleware/auth.js` — Bearer token guard for all protected routes
- `models/User.js` — Mongoose schema with name, email, password (select: false), phone, riskProfile, isActive

### Frontend pages
- `/login` — email/password form with show/hide password, brand panel, error handling
- `/register` — 3-step form: personal info → password → risk profile selection
- `/dashboard/layout.tsx` — auth guard (reads localStorage token), sidebar nav, mobile hamburger menu
- `/dashboard/settings` — edit profile + change password with live feedback

---

## ✅ Stage 2 — Portfolio Core (Done)

### What was built
- `models/Investment.js` — Mongoose schema supporting 10 asset types with `investedAmount` auto-calculation
- `routes/portfolio.js` — full CRUD + summary endpoint
  - `GET /api/portfolio` — list with filters (type, search, sort, order)
  - `POST /api/portfolio` — add investment
  - `PUT /api/portfolio/:id` — edit investment
  - `DELETE /api/portfolio/:id` — remove investment
  - `GET /api/portfolio/summary` — dashboard stats (total invested, current value, gain/loss, byType breakdown, recent 5)

### 10 supported asset types
| Type | Key Fields |
|---|---|
| `stock` | symbol, exchange, units, buyPrice, buyDate |
| `mutual_fund` | AMFI code (symbol), units, NAV (buyPrice), buyDate |
| `sip` | AMFI code, sipAmount, instalments, avgNav, sipStartDate |
| `fd` | principal, interestRate, tenureMonths, institution, maturityDate |
| `ppf` | principal, interestRate, maturityDate |
| `epf` | principal, interestRate |
| `nps` | principal, interestRate, institution (Tier 1/2) |
| `bond` | units, buyPrice, interestRate, institution, maturityDate |
| `gold` | symbol, units (grams), buyPrice/gram |
| `crypto` | symbol, units, buyPrice |

### Frontend pages
- `/dashboard` — stat cards (invested, current value, gain/loss, holdings count), conic-gradient donut chart, asset-class breakdown bars, recent investments list, empty state
- `/dashboard/portfolio` — table with type filter tabs (All, Stocks, MF, SIP, FD, PPF/EPF, Gold, NPS, Bonds, Crypto), search, sortable columns, gain/loss badges, LIVE price badge, edit modal, delete confirm dialog, Refresh Prices button, portfolio totals bar
- `/dashboard/add` — 2-step form (select type → enter details), adaptive fields per type, Live Price Fetch buttons

---

## ✅ Stage 3 — Live Price APIs (Done)

### Backend services built
- `services/priceService.js`
  - Yahoo Finance (`yahoo-finance2`) — stocks (NSE `.NS` / BSE `.BO`), gold via `GC=F` + `INR=X` (troy oz → grams conversion)
  - mfapi.in (free AMFI mirror) — mutual fund / SIP NAV
  - CoinGecko (free, no API key) — crypto prices in INR
  - 400ms delay between requests to avoid rate-limiting
  - Gold price cached once per update run

- `jobs/priceUpdater.js`
  - `node-cron` job runs **daily at 4:00 PM IST, Monday–Friday** (after NSE close)
  - Updates all users' marketable assets in one pass

- `routes/prices.js`
  - `POST /api/prices/refresh` — manual trigger (60s cooldown per user)
  - `GET /api/prices/stock/:symbol?exchange=NSE` — single stock lookup
  - `GET /api/prices/mf/:amfiCode` — single MF NAV lookup
  - `GET /api/prices/gold` — current gold price (₹/gram)
  - `GET /api/prices/crypto/:symbol` — single crypto price (INR)

### Frontend integration
- `src/lib/api.ts` — `pricesApi` client methods
- `Investment` type extended with `currentValue`, `gain`, `gainPercent`, `lastPriceUpdate`
- **Refresh Prices** button on Portfolio page with spinner + toast feedback
- **Fetch Live Price** buttons in Add Investment form for: Stocks, Mutual Funds, SIP NAV, Gold, Crypto

---

## ✅ Audit Fixes (Done — 2026-09-20)

| # | Issue | Fix Applied |
|---|---|---|
| B2 | Dashboard spinner never cleared when user not logged in | Added `setChecking(false)` before redirect |
| B3 | `yahoo-finance2` required inside hot-path function (every lookup) | Moved to top-level module require |
| H2 | `Sidebar` defined inside layout → React remounts on every state update | Extracted to proper standalone component outside layout |
| M3 | Refresh Prices endpoint had no rate limiting — could spam external APIs | Added 60s in-memory cooldown per user |
| Q3 | PPF/EPF filter tab only matched `ppf`, missing `epf` investments | Tab now sends `ppf_epf`, backend uses MongoDB `$in: ["ppf", "epf"]` |
| Q7 | Mobile sidebar `slideIn` animation class was undefined | Added inline `<style>` `@keyframes slideIn` |

---

## 🔲 Remaining / Later Tasks

### 🔴 Blockers
*None currently.* Infrastructure prerequisites are active and verified.

### 🟢 Database & Connectivity (Resolved ✅ 2026-09-21)
- [x] **Resume MongoDB Atlas cluster** — Cluster resumed & connected
- [x] **Whitelist IP in Atlas** — Network Access configured & active

---

### 🟡 Admin Panel Migration (Planned — do after user-facing pages are stable)
The admin panel (`/admin`) currently uses **Supabase** for:
- CMS content editing (homepage sections, blog posts)
- Inquiry management
- No changes made to this yet — deliberately left untouched

**What needs to be done when ready:**
- [ ] Migrate admin auth from Supabase to MongoDB (or keep as separate admin credentials)
- [ ] Move CMS content (blog, homepage sections) from Supabase tables → MongoDB collections
- [ ] Move inquiries/contact form submissions from Supabase → MongoDB
- [ ] Update admin panel API calls from Supabase client → Phoenix Engine endpoints
- [ ] Create new admin routes in `phoenix-engine/routes/admin.js` (protected by admin role)
- [ ] Add `role: { type: String, enum: ["user", "admin"], default: "user" }` to `User.js` model

---

### 🟢 Code Quality (Nice-to-have, non-breaking)
- [ ] Extract shared `TYPE_META` (asset type labels + colors) to `src/lib/investmentMeta.ts` — currently duplicated in 3 files
- [ ] Extract `fmt()` currency formatter to `src/lib/format.ts` — currently duplicated in 3 files
- [ ] Add persistent `lastRefreshed` timestamp to the portfolio page (currently resets on navigation)
- [ ] Add `tags` field UI — the Investment model supports `tags[]` but there's no UI for it yet

---

### 🔵 Portfolio Reports & Features
- [x] **Export Master Portfolio to PDF / Printable Statement** ✅ (2026-09-21) — Institutional-grade Master Portfolio Statement matching Advisorkhoj/wealth management format, including investor & Phoenix distributor headers, KPI summary bar, multi-asset allocation SVG donut chart & exposure table, and grouped holdings tables (Mutual Funds, Equities, Fixed Income).
- [ ] Export portfolio to CSV
- [ ] Email alerts when gain/loss crosses a threshold
- [ ] Historical price charts (line chart per investment)
- [ ] Multi-currency support (USD, EUR holdings)
- [ ] Tax P&L report (STCG / LTCG calculation)
- [ ] Nominee / family member sub-portfolios

---

## 🚀 How to Run

```bash
# 1. Start the backend (phoenix-engine)
cd phoenix-engine
node server.js
# ✓ MongoDB Atlas connected
# ✓ Phoenix Engine running on http://localhost:5000
# ✓ Price update cron started (runs Mon–Fri 4 PM IST)

# 2. Start the frontend (phoenix-project)
cd phoenix-project
npm run dev
# ✓ http://localhost:3000
```

### Environment files

**`phoenix-engine/.env`**
```
MONGO_URI=mongodb+srv://root:1234@userdata.fyv8r.mongodb.net/phoenix_portfolio?retryWrites=true&w=majority
JWT_SECRET=phoenix_jwt_super_secret_key_2026_change_in_prod
PORT=5000
CLIENT_URL=http://localhost:3000
```

**`phoenix-project/.env.local`** (key entry)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

> ⚠️ Change `JWT_SECRET` to a strong random string before deploying to production.

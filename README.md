# 🎾 Tennis Coach PH — Scheduling MVP

A simple, mobile-first scheduling site for a tennis coach in the Philippines. Players can browse the coach's profile, view available time slots, check rates, and submit a booking request — all without needing an account. The coach manages everything from a protected dashboard.

## Quick Start

```bash
# 1. Install dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# 2. Seed the database with sample data
npm run seed

# 3. Start both server and client
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Coach Dashboard**: http://localhost:5173/login

### Default Login Credentials

## Tech Stack

| Layer      | Technology              |
|------------|-------------------------|
| Frontend   | React 18 + Vite + Tailwind CSS |
| Backend    | Express.js (ES Modules) |
| Database   | SQLite via sql.js       |
| Auth       | JWT + bcryptjs          |

## Project Structure

```
Project/
├── package.json              # Root scripts (dev, seed)
├── server/
│   ├── index.js              # Express server (port 3001)
│   ├── db/
│   │   ├── database.js       # sql.js database init & helpers
│   │   ├── seed.js           # Sample data seeder
│   │   └── tennis_coach.db   # SQLite database file (auto-generated)
│   ├── middleware/
│   │   └── auth.js           # JWT auth middleware
│   └── routes/
│       ├── auth.js           # POST /login
│       ├── profile.js        # GET, PUT /profile
│       ├── availability.js   # CRUD /availability
│       ├── rates.js          # CRUD /rates
│       └── bookings.js       # POST (public), GET, PUT /bookings
├── client/
│   ├── src/
│   │   ├── api/client.js     # Fetch wrapper for all API calls
│   │   ├── context/AuthContext.jsx
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProfileSection.jsx
│   │   │   ├── CalendarSection.jsx
│   │   │   ├── RatesSection.jsx
│   │   │   ├── BookingForm.jsx
│   │   │   └── DashboardLayout.jsx
│   │   └── pages/            # Route pages
│   │       ├── Home.jsx              # Public landing page
│   │       ├── Login.jsx             # Coach login
│   │       ├── DashboardBookings.jsx
│   │       ├── DashboardAvailability.jsx
│   │       ├── DashboardRates.jsx
│   │       └── DashboardProfile.jsx
│   └── ...
```

## API Endpoints

### Public (no auth needed)
| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/profile` | Coach profile |
| `GET` | `/api/availability` | Available (non-blocked) time slots |
| `GET` | `/api/rates` | Session rates |
| `POST` | `/api/bookings` | Submit a booking request |

### Coach Dashboard (JWT required)
| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/auth/login` | Login, get token |
| `PUT` | `/api/profile` | Update profile |
| `GET` | `/api/availability/all` | All slots (incl. blocked) |
| `POST` | `/api/availability` | Add time slot |
| `PUT` | `/api/availability/:id` | Edit slot |
| `DELETE` | `/api/availability/:id` | Delete slot |
| `POST` | `/api/rates` | Add rate |
| `PUT` | `/api/rates/:id` | Edit rate |
| `DELETE` | `/api/rates/:id` | Delete rate |
| `GET` | `/api/bookings` | All bookings |
| `PUT` | `/api/bookings/:id/status` | Accept or decline |

## Features Included (MVP)

- ✅ **Coach Profile** — photo, bio, experience, specialties, location, contact links (Messenger, Viber)
- ✅ **Weekly Calendar** — browse available slots by day, click to book
- ✅ **Session Rates** — per-session pricing with package deals highlighted
- ✅ **Booking Form** — player picks a slot and enters contact info
- ✅ **Coach Dashboard** — login, manage bookings/availability/rates/profile
- ✅ **Booking Management** — accept/decline with SMS shortcut links
- ✅ **Mobile-First Design** — works great on phones (important for PH market)
- ✅ **Philippine Peso (₱)** — all prices formatted in PHP

## License

MIT

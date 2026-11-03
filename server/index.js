/**
 * Tennis Coach Scheduling API — Main Entry Point
 *
 * Express server on port 3001 with CORS support.
 * Mounts all API routes under /api/*.
 */

import express from 'express';
import cors from 'cors';

// Route modules
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import availabilityRoutes from './routes/availability.js';
import ratesRoutes from './routes/rates.js';
import bookingsRoutes from './routes/bookings.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// Enable CORS (allow the Vite dev server on localhost:5173)
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/rates', ratesRoutes);
app.use('/api/bookings', bookingsRoutes);

// Simple health-check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

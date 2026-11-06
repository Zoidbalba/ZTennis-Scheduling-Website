/**
 * Tennis Coach Scheduling API — Main Entry Point
 *
 * Express server on port 3001 with CORS support.
 * Mounts all API routes under /api/*.
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Route modules
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import availabilityRoutes from './routes/availability.js';
import ratesRoutes from './routes/rates.js';
import bookingsRoutes from './routes/bookings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// Enable CORS (allow development Vite server and production)
app.use(
  cors({
    origin: true,
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

// Serve frontend static assets from client/dist in production
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Fallback to index.html for client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('API is running. Build frontend with `npm run build` to view the UI.');
    }
  });
});

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

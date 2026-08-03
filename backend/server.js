/**
 * KalaaKart — Express Backend (Full Platform)
 * Phase 2 AI Layer I + Full Platform Routes
 *
 * Routes:
 *   GET  /api/health
 *   GET  /api/recommendations          ← rule-based engine
 *   GET  /api/recommendations/collab   ← collaborative filtering
 *   POST /api/auth/register|login
 *   GET  /api/auth/me
 *   GET  /api/listings
 *   POST /api/listings
 *   GET  /api/listings/categories
 *   GET  /api/rentals
 *   POST /api/rentals
 *   PATCH /api/rentals/:id
 *   GET  /api/messages
 *   POST /api/messages
 *   GET  /api/pricing/suggest
 *   GET  /api/search
 *   GET  /api/admin/stats|listings|users
 *   PATCH /api/admin/listings/:id/flag
 *   PATCH /api/admin/users/:id/ban
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const { getRentalRecommendations, formatAsText } = require('./engine');

const authRouter     = require('./routes/auth').router;
const listingsRouter = require('./routes/listings');
const rentalsRouter  = require('./routes/rentals');
const messagesRouter = require('./routes/messages');
const pricingRouter  = require('./routes/pricing');
const searchRouter   = require('./routes/search');
const adminRouter    = require('./routes/admin');
const collabRouter   = require('./routes/collab');
const profilesRouter = require('./routes/profiles');
const mentorRouter   = require('./routes/mentor');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Rule-based recommendations (existing) ─────────────────────────────────────

app.get('/api/recommendations', (req, res) => {
  const { branch, semester, semesterStartDate } = req.query;

  if (!branch || branch.trim() === '') {
    return res.status(400).json({ error: 'Missing required query param: branch (non-empty string).' });
  }
  const semesterInt = parseInt(semester, 10);
  if (!semester || isNaN(semesterInt) || semesterInt < 1 || semesterInt > 8) {
    return res.status(400).json({ error: 'Missing or invalid query param: semester (must be an integer 1–8).' });
  }
  if (!semesterStartDate || isNaN(new Date(semesterStartDate).getTime())) {
    return res.status(400).json({ error: 'Missing or invalid query param: semesterStartDate (ISO date string).' });
  }

  const studentProfile = { branch: branch.trim(), semester: semesterInt, semesterStartDate: semesterStartDate.trim() };
  try {
    const recommendations = getRentalRecommendations(studentProfile);
    const text            = formatAsText(recommendations, studentProfile);
    return res.json({ recommendations, text });
  } catch (err) {
    console.error('Engine error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Collaborative filtering ───────────────────────────────────────────────────

app.use('/api/recommendations', collabRouter);

// ── All platform routes ───────────────────────────────────────────────────────

app.use('/api/auth',     authRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/rentals',  rentalsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/pricing',  pricingRouter);
app.use('/api/search',   searchRouter);
app.use('/api/admin',    adminRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/mentor',   mentorRouter);

// ── Serve Static Frontend ─────────────────────────────────────────────────────

app.use('/platform', express.static(path.join(__dirname, '../platform')));
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

// ── 404 ───────────────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[KalaaKart] Full platform API → http://localhost:${PORT}`);
  console.log(`  Health        : http://localhost:${PORT}/api/health`);
  console.log(`  Recommendations: http://localhost:${PORT}/api/recommendations?branch=Computer+Engineering&semester=3&semesterStartDate=2026-08-10`);
  console.log(`  Listings      : http://localhost:${PORT}/api/listings`);
  console.log(`  Admin stats   : http://localhost:${PORT}/api/admin/stats`);
});

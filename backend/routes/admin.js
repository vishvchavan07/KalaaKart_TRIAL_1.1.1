const express = require('express');
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();

const LISTINGS_FILE = path.join(__dirname, '../data/listings.json');
const USERS_FILE    = path.join(__dirname, '../data/users.json');
const RENTALS_FILE  = path.join(__dirname, '../data/rentals.json');

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  const listings = JSON.parse(fs.readFileSync(LISTINGS_FILE, 'utf-8'));
  const users    = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  const rentals  = JSON.parse(fs.readFileSync(RENTALS_FILE, 'utf-8'));
  res.json({
    totalListings   : listings.filter(l => l.type === 'item').length,
    availableListings: listings.filter(l => l.type === 'item' && l.available && !l.flagged).length,
    flaggedListings : listings.filter(l => l.flagged).length,
    totalUsers      : users.filter(u => u.id !== 'admin').length,
    bannedUsers     : users.filter(u => u.banned).length,
    totalRentals    : rentals.length,
    activeRentals   : rentals.filter(r => r.status === 'active').length,
    pendingRentals  : rentals.filter(r => r.status === 'pending').length,
    completedRentals: rentals.filter(r => r.status === 'completed').length,
  });
});

// GET /api/admin/listings
router.get('/listings', (req, res) => {
  const listings = JSON.parse(fs.readFileSync(LISTINGS_FILE, 'utf-8'));
  res.json({ listings });
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
    .filter(u => u.id !== 'admin')
    .map(({ password: _, ...u }) => u);
  res.json({ users });
});

// PATCH /api/admin/users/:id/ban
router.patch('/users/:id/ban', (req, res) => {
  const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  const idx   = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found.' });
  users[idx].banned = !users[idx].banned;
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  const { password: _, ...safe } = users[idx];
  res.json({ user: safe });
});

module.exports = router;

const express = require('express');
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();

const RENTALS_FILE  = path.join(__dirname, '../data/rentals.json');
const LISTINGS_FILE = path.join(__dirname, '../data/listings.json');

// GET /api/recommendations/collab?branch=&semester=
router.get('/collab', (req, res) => {
  const { branch, semester } = req.query;
  if (!branch || !semester) return res.status(400).json({ error: 'branch and semester required.' });

  const users    = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/users.json'), 'utf-8'));
  const rentals  = JSON.parse(fs.readFileSync(RENTALS_FILE, 'utf-8'));
  const listings = JSON.parse(fs.readFileSync(LISTINGS_FILE, 'utf-8'));

  // Find peer user IDs (same branch & semester)
  const peers = users
    .filter(u => u.branch === branch && String(u.semester) === String(semester))
    .map(u => u.id);

  // Count how often each listing was rented by peers
  const freq = {};
  rentals
    .filter(r => peers.includes(r.renterId) && r.status === 'completed')
    .forEach(r => { freq[r.listingId] = (freq[r.listingId] || 0) + 1; });

  // Sort by frequency, join listing data
  const collab = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([listingId, count]) => {
      const listing = listings.find(l => l.id === listingId);
      return listing ? { ...listing, rentCount: count } : null;
    })
    .filter(Boolean);

  res.json({
    branch, semester: parseInt(semester, 10),
    peerCount: peers.length,
    recommendations: collab,
    message: collab.length
      ? `Students in ${branch} Sem ${semester} frequently rented these items:`
      : `Not enough rental data yet for ${branch} Sem ${semester} — check back later.`,
  });
});

module.exports = router;

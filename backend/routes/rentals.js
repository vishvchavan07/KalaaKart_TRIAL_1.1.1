const express = require('express');
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();
const { verifyToken } = require('./auth');

const FILE = path.join(__dirname, '../data/rentals.json');
function read()      { return JSON.parse(fs.readFileSync(FILE, 'utf-8')); }
function write(data) { fs.writeFileSync(FILE, JSON.stringify(data, null, 2)); }

// GET /api/rentals?userId=
router.get('/', (req, res) => {
  const { userId } = req.query;
  let rentals = read();
  if (userId) rentals = rentals.filter(r => r.renterId === userId || r.ownerId === userId);
  res.json({ rentals });
});

// POST /api/rentals
router.post('/', (req, res) => {
  const token  = (req.headers.authorization || '').replace('Bearer ', '');
  const userId = verifyToken(token);
  if (!userId) return res.status(401).json({ error: 'Authentication required.' });

  const { listingId, ownerId, startDate, endDate } = req.body;
  if (!listingId || !ownerId || !startDate || !endDate) {
    return res.status(400).json({ error: 'listingId, ownerId, startDate, endDate required.' });
  }
  if (userId === ownerId) return res.status(400).json({ error: 'You cannot rent your own item.' });

  const rentals = read();
  const newRental = {
    id: 'r' + Date.now(),
    listingId, ownerId,
    renterId  : userId,
    status    : 'pending',
    startDate, endDate,
    createdAt : new Date().toISOString(),
  };
  rentals.push(newRental);
  write(rentals);
  res.status(201).json({ rental: newRental });
});

// PATCH /api/rentals/:id  — update status
router.patch('/:id', (req, res) => {
  const token  = (req.headers.authorization || '').replace('Bearer ', '');
  const userId = verifyToken(token);
  if (!userId) return res.status(401).json({ error: 'Authentication required.' });

  const rentals = read();
  const idx     = rentals.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Rental not found.' });

  const rental  = rentals[idx];
  const { status } = req.body;
  const VALID = ['pending','active','completed','cancelled','rejected'];
  if (!VALID.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

  // Only owner can accept/reject; only renter can cancel; either can complete
  if (['active','rejected'].includes(status) && rental.ownerId !== userId) {
    return res.status(403).json({ error: 'Only the owner can accept or reject a request.' });
  }
  if (status === 'cancelled' && rental.renterId !== userId) {
    return res.status(403).json({ error: 'Only the renter can cancel.' });
  }

  rentals[idx].status = status;
  write(rentals);
  res.json({ rental: rentals[idx] });
});

module.exports = router;

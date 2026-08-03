const express = require('express');
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();
const { verifyToken } = require('./auth');

const FILE = path.join(__dirname, '../data/listings.json');
function read()         { return JSON.parse(fs.readFileSync(FILE, 'utf-8')); }
function write(data)    { fs.writeFileSync(FILE, JSON.stringify(data, null, 2)); }

// GET /api/listings
router.get('/', (req, res) => {
  let listings = read().filter(l => l.type === 'item');
  const { category, branch, minPrice, maxPrice, available, q } = req.query;

  if (category)  listings = listings.filter(l => l.category === category);
  if (available === 'true')  listings = listings.filter(l => l.available && !l.flagged);
  if (minPrice)  listings = listings.filter(l => l.pricePerDay >= Number(minPrice));
  if (maxPrice)  listings = listings.filter(l => l.pricePerDay <= Number(maxPrice));
  if (q) {
    const ql = q.toLowerCase();
    listings = listings.filter(l =>
      l.title.toLowerCase().includes(ql) ||
      l.description.toLowerCase().includes(ql) ||
      (l.tags && l.tags.some(t => t.includes(ql)))
    );
  }
  res.json({ listings });
});

// GET /api/listings/categories
router.get('/categories', (req, res) => {
  const listings = read().filter(l => l.type === 'item');
  const cats = [...new Set(listings.map(l => l.category))].sort();
  res.json({ categories: cats });
});

// GET /api/listings/:id
router.get('/:id', (req, res) => {
  const listing = read().find(l => l.id === req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found.' });
  res.json({ listing });
});

// POST /api/listings  (auth required)
router.post('/', (req, res) => {
  const token  = (req.headers.authorization || '').replace('Bearer ', '');
  const userId = verifyToken(token);
  if (!userId) return res.status(401).json({ error: 'Authentication required.' });

  const { title, category, description, pricePerDay, college, tags } = req.body;
  if (!title || !category || !pricePerDay || !college) {
    return res.status(400).json({ error: 'title, category, pricePerDay, and college are required.' });
  }

  const listings = read();
  const newItem = {
    id         : 'l' + Date.now(),
    title      : title.trim(),
    category,
    description: description || '',
    pricePerDay: Number(pricePerDay),
    ownerId    : userId,
    college,
    available  : true,
    flagged    : false,
    type       : 'item',
    tags       : Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim().toLowerCase()) : []),
  };
  listings.push(newItem);
  write(listings);
  res.status(201).json({ listing: newItem });
});

// PATCH /api/listings/:id/flag  (admin)
router.patch('/:id/flag', (req, res) => {
  const listings = read();
  const idx = listings.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found.' });
  listings[idx].flagged = !listings[idx].flagged;
  write(listings);
  res.json({ listing: listings[idx] });
});

module.exports = router;

const express = require('express');
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();

const LISTINGS_FILE = path.join(__dirname, '../data/listings.json');

// GET /api/pricing/suggest?category=&condition=
router.get('/suggest', (req, res) => {
  const { category, condition } = req.query;
  if (!category) return res.status(400).json({ error: 'category is required.' });

  const listings = JSON.parse(fs.readFileSync(LISTINGS_FILE, 'utf-8'))
    .filter(l => l.type === 'item' && l.category === category && !l.flagged);

  if (listings.length === 0) {
    return res.json({ min: null, max: null, median: null, count: 0, message: 'No data for this category yet.' });
  }

  const prices = listings.map(l => l.pricePerDay).sort((a, b) => a - b);
  const min    = prices[0];
  const max    = prices[prices.length - 1];
  const mid    = Math.floor(prices.length / 2);
  const median = prices.length % 2 === 0
    ? Math.round((prices[mid - 1] + prices[mid]) / 2)
    : prices[mid];

  // Condition multiplier: Good=1.0, Fair=0.8, Poor=0.6
  const multiplier = condition === 'Poor' ? 0.6 : condition === 'Fair' ? 0.8 : 1.0;
  const suggested  = Math.round(median * multiplier);

  res.json({
    min, max, median, count: listings.length,
    suggested,
    condition: condition || 'Good',
    message: `Based on ${listings.length} similar listing${listings.length > 1 ? 's' : ''} — suggested price for ${condition || 'Good'} condition: ₹${suggested}/day`
  });
});

module.exports = router;

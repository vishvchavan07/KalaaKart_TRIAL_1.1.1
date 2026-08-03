const express = require('express');
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();

const LISTINGS_FILE = path.join(__dirname, '../data/listings.json');

// Synonym map for natural-language search
const SYNONYMS = {
  'voltage': ['multimeter','oscilloscope','voltmeter','measurement'],
  'current': ['multimeter','ammeter','measurement'],
  'resistance': ['multimeter','measurement'],
  'measure': ['multimeter','calipers','measuring tape','oscilloscope'],
  'microcontroller': ['arduino','esp32','raspberry pi'],
  'camera': ['dslr','photography','canon'],
  'photo': ['dslr','camera','photography'],
  'film': ['dslr','camera','tripod'],
  'soldering': ['soldering iron','tools'],
  'weld': ['soldering iron'],
  'internet': ['wifi','router','networking'],
  'network': ['wifi','router'],
  'power': ['power bank','battery'],
  'battery': ['power bank'],
  'linux': ['raspberry pi'],
  'robot': ['servo','arduino','robotics kit'],
  'automation': ['servo','arduino'],
  'safety': ['lab coat','goggles'],
  'coat': ['lab coat'],
  'goggles': ['safety goggles'],
  'exam': ['calculator','scientific calculator'],
  'maths': ['calculator'],
  'survey': ['theodolite','measuring tape','vernier'],
  'iot': ['esp32','raspberry pi','arduino'],
  'breadboard': ['breadboard','prototyping'],
  'circuit': ['breadboard','arduino'],
};

function extractKeywords(query) {
  const q    = query.toLowerCase();
  const base = q.split(/\s+/).filter(w => w.length > 2);
  const expanded = new Set(base);
  for (const [key, vals] of Object.entries(SYNONYMS)) {
    if (q.includes(key)) vals.forEach(v => expanded.add(v));
  }
  return [...expanded];
}

// GET /api/search?q=
router.get('/', (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.status(400).json({ error: 'Query must be at least 2 characters.' });

  const keywords = extractKeywords(q.trim());
  const listings = JSON.parse(fs.readFileSync(LISTINGS_FILE, 'utf-8'))
    .filter(l => l.type === 'item' && !l.flagged);

  // Score each listing by how many keywords match its tags/title/description
  const scored = listings.map(l => {
    const haystack = [l.title, l.description, ...(l.tags || [])].join(' ').toLowerCase();
    const score    = keywords.filter(kw => haystack.includes(kw)).length;
    return { ...l, _score: score };
  }).filter(l => l._score > 0)
    .sort((a, b) => b._score - a._score);

  res.json({
    query: q,
    interpreted: keywords.slice(0, 6),
    results: scored.map(({ _score, ...l }) => l),
    count: scored.length,
  });
});

module.exports = router;

const express = require('express');
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();
const { verifyToken } = require('./auth');

const FILE = path.join(__dirname, '../data/messages.json');
function read()      { return JSON.parse(fs.readFileSync(FILE, 'utf-8')); }
function write(data) { fs.writeFileSync(FILE, JSON.stringify(data, null, 2)); }

// GET /api/messages?rentalId=
router.get('/', (req, res) => {
  const { rentalId } = req.query;
  if (!rentalId) return res.status(400).json({ error: 'rentalId required.' });
  const msgs = read().filter(m => m.rentalId === rentalId);
  res.json({ messages: msgs });
});

// POST /api/messages
router.post('/', (req, res) => {
  const token  = (req.headers.authorization || '').replace('Bearer ', '');
  const userId = verifyToken(token);
  if (!userId) return res.status(401).json({ error: 'Authentication required.' });

  const { rentalId, body } = req.body;
  if (!rentalId || !body || !body.trim()) {
    return res.status(400).json({ error: 'rentalId and body required.' });
  }
  const msgs = read();
  const msg  = { id: 'm' + Date.now(), rentalId, senderId: userId, body: body.trim(), ts: new Date().toISOString() };
  msgs.push(msg);
  write(msgs);
  res.status(201).json({ message: msg });
});

module.exports = router;

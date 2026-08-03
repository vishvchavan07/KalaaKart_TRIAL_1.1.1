const express = require('express');
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();
const { verifyToken } = require('./auth');

const USERS_FILE = path.join(__dirname, '../data/users.json');
function readUsers()       { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); }
function writeUsers(users) { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)); }

// Strip sensitive fields for public view
function safeProfile(u) {
  const { password, ...pub } = u;
  return pub;
}

// GET /api/profiles  — public list (no passwords)
router.get('/', (req, res) => {
  let users = readUsers()
    .filter(u => u.id !== 'admin')
    .map(safeProfile);

  const { role, q, college } = req.query;

  if (role && role !== 'All') {
    users = users.filter(u => Array.isArray(u.role) && u.role.includes(role));
  }
  if (college) {
    users = users.filter(u => u.college === college);
  }
  if (q) {
    const ql = q.toLowerCase();
    users = users.filter(u =>
      u.name.toLowerCase().includes(ql) ||
      (u.bio  && u.bio.toLowerCase().includes(ql)) ||
      (u.skills && u.skills.some(s => s.toLowerCase().includes(ql))) ||
      (u.creativeTitle && u.creativeTitle.toLowerCase().includes(ql))
    );
  }

  res.json({ profiles: users });
});

// GET /api/profiles/:id  — single public profile
router.get('/:id', (req, res) => {
  const users = readUsers();
  const user  = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Profile not found.' });
  res.json({ profile: safeProfile(user) });
});

// POST /api/profiles  — create/update own profile (auth required)
router.post('/', (req, res) => {
  const token  = (req.headers.authorization || '').replace('Bearer ', '');
  const userId = verifyToken(token);
  if (!userId) return res.status(401).json({ error: 'Authentication required.' });

  const users = readUsers();
  const idx   = users.findIndex(u => u.id === userId);
  if (idx === -1) return res.status(404).json({ error: 'User not found.' });

  const allowed = [
    'creativeTitle','skills','bio','story','photo','gallery',
    'priceMin','priceMax','negotiable','phone','usageTags','role'
  ];

  allowed.forEach(field => {
    if (req.body[field] !== undefined) users[idx][field] = req.body[field];
  });

  writeUsers(users);
  res.json({ profile: safeProfile(users[idx]) });
});

module.exports = router;

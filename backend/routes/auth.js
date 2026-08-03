const express = require('express');
const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');
const router  = express.Router();

const USERS_FILE = path.join(__dirname, '../data/users.json');

function readUsers()        { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); }
function writeUsers(users)  { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)); }

// Minimal JWT-like token: base64(userId).base64(secret-hash) — no library needed
const SECRET = 'kalaakart-demo-secret-2026';
function makeToken(userId) {
  const payload = Buffer.from(userId).toString('base64');
  const sig     = crypto.createHmac('sha256', SECRET).update(userId).digest('base64url');
  return `${payload}.${sig}`;
}
function verifyToken(token) {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const userId      = Buffer.from(payload, 'base64').toString('utf-8');
  const expectedSig = crypto.createHmac('sha256', SECRET).update(userId).digest('base64url');
  if (sig !== expectedSig) return null;
  return userId;
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, branch, semester, college, semesterStartDate } = req.body;
  if (!name || !email || !password || !branch || !semester || !college) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  const users = readUsers();
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }
  const newUser = {
    id: 'u' + Date.now(),
    name, email, password,
    branch,
    semester: parseInt(semester, 10),
    college,
    semesterStartDate: semesterStartDate || new Date().toISOString().split('T')[0],
    banned: false,
  };
  users.push(newUser);
  writeUsers(users);
  const token = makeToken(newUser.id);
  const { password: _, ...safe } = newUser;
  res.status(201).json({ token, user: safe });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  const users = readUsers();
  const user  = users.find(u => u.email === email && u.password === password);
  if (!user)   return res.status(401).json({ error: 'Invalid email or password.' });
  if (user.banned) return res.status(403).json({ error: 'Your account has been suspended.' });
  const token = makeToken(user.id);
  const { password: _, ...safe } = user;
  res.json({ token, user: safe });
});

// GET /api/auth/me  (validate token + return user)
router.get('/me', (req, res) => {
  const token  = (req.headers.authorization || '').replace('Bearer ', '');
  const userId = verifyToken(token);
  if (!userId) return res.status(401).json({ error: 'Invalid or missing token.' });
  const users = readUsers();
  const user  = users.find(u => u.id === userId);
  if (!user)   return res.status(404).json({ error: 'User not found.' });
  const { password: _, ...safe } = user;
  res.json({ user: safe });
});

module.exports = { router, verifyToken };

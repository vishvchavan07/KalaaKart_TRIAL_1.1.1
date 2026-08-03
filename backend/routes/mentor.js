const express = require('express');
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();

const SESSIONS_FILE = path.join(__dirname, '../data/mentor-sessions.json');
const USERS_FILE    = path.join(__dirname, '../data/users.json');

function readSessions() { return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8')); }
function readUsers()    { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); }

function safeUser(u) {
  const { password, ...pub } = u;
  return pub;
}

// GET /api/mentor/sessions?subject=&freeOnly=
router.get('/sessions', (req, res) => {
  const { subject, freeOnly } = req.query;
  let sessions = readSessions();
  const users  = readUsers();

  if (subject && subject !== 'All') {
    sessions = sessions.filter(s => s.subject === subject);
  }
  if (freeOnly === 'true') {
    sessions = sessions.filter(s => s.isFree);
  }

  // Join mentor profile data
  const result = sessions.map(s => {
    const mentor = users.find(u => u.id === s.mentorId);
    return {
      ...s,
      mentor: mentor ? safeUser(mentor) : null,
    };
  });

  res.json({ sessions: result });
});

// GET /api/mentor/subjects  — distinct subject list from data
router.get('/subjects', (req, res) => {
  const sessions = readSessions();
  const subjects = [...new Set(sessions.map(s => s.subject))].sort();
  res.json({ subjects });
});

module.exports = router;

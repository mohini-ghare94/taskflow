// routes/auth.js - /api/auth/register, /login, /logout
const express = require('express');
const User = require('../models/User');
const { createSession, destroySession, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || username.trim().length < 3)
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  if (!password || password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (User.findByUsername(username))
    return res.status(409).json({ error: 'Username already taken' });

  const user = User.create(username.trim(), password);
  res.status(201).json({ token: createSession(user), username: user.username });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = username && password && User.findByUsername(username);
  if (!user || !User.verify(user, password))
    return res.status(401).json({ error: 'Wrong username or password' });
  res.json({ token: createSession(user), username: user.username });
});

router.post('/logout', requireAuth, (req, res) => {
  destroySession(req.token);
  res.json({ ok: true });
});

module.exports = router;

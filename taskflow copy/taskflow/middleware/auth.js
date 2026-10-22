// middleware/auth.js - verification middleware: blocks requests without a valid token
const crypto = require('crypto');
const sessions = new Map();   // token -> { userId, username }  (kept in memory)

function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId: user.id, username: user.username });
  return token;
}
function destroySession(token) { sessions.delete(token); }

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const session = token && sessions.get(token);
  if (!session) return res.status(401).json({ error: 'Please log in first' });
  req.user = session;
  req.token = token;
  next();                      // verified -> continue to the route
}

module.exports = { requireAuth, createSession, destroySession };

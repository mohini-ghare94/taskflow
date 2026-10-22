// index.js - entry point: creates the server, loads middleware and routers
const express = require('express');
const path = require('path');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());                                   // parse JSON request bodies
app.use(express.static(path.join(__dirname, 'public')));   // serve the front-end

app.use('/api/auth', authRoutes);                          // public routes (login/register)
app.use('/api/tasks', requireAuth, taskRoutes);            // protected routes (middleware runs first)

// Unknown API route
app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found' }));

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

app.listen(PORT, () => console.log(`TaskFlow running at http://localhost:${PORT}`));

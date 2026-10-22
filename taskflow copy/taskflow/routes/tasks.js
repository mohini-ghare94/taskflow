// routes/tasks.js - CRUD routes + XML export
const express = require('express');
const Task = require('../models/Task');
const { validateTask } = require('../middleware/validate');

const router = express.Router();

// READ all
router.get('/', (req, res) => res.json(Task.all(req.user.userId)));

// XML EXPORT (must be above '/:id' routes)
const esc = (s) => String(s ?? '').replace(/[<>&'"]/g, c =>
  ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

router.get('/export/xml', (req, res) => {
  const items = Task.all(req.user.userId).map(t => `  <task id="${esc(t.id)}">
    <title>${esc(t.title)}</title>
    <description>${esc(t.description)}</description>
    <priority>${esc(t.priority)}</priority>
    <status>${esc(t.status)}</status>
    <dueDate>${esc(t.dueDate)}</dueDate>
    <dueTime>${esc(t.dueTime)}</dueTime>
    <category>${esc(t.category)}</category>
  </task>`).join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<tasks>\n${items}\n</tasks>`);
});

// CREATE
router.post('/', validateTask, (req, res) => res.status(201).json(Task.create(req.user.userId, req.body)));

// UPDATE
router.put('/:id', validateTask, (req, res) => {
  const task = Task.update(req.user.userId, req.params.id, req.body);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// DELETE
router.delete('/:id', (req, res) => {
  if (!Task.remove(req.user.userId, req.params.id)) return res.status(404).json({ error: 'Task not found' });
  res.json({ ok: true });
});

module.exports = router;

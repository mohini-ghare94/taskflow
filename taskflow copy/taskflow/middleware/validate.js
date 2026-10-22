// middleware/validate.js - server-side validation of task data
const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['pending', 'completed'];
const CATEGORIES = ['General', 'Study', 'Personal', 'Work', 'Project'];

function validateTask(req, res, next) {
  const { title, priority, status, dueDate, dueTime, category } = req.body;
  const isCreate = req.method === 'POST';

  if (isCreate || title !== undefined) {
    if (typeof title !== 'string' || title.trim().length < 3 || title.length > 100)
      return res.status(400).json({ error: 'Title must be 3 to 100 characters' });
    req.body.title = title.trim();
  }
  if (priority !== undefined && !PRIORITIES.includes(priority))
    return res.status(400).json({ error: 'Priority must be low, medium or high' });
  if (status !== undefined && !STATUSES.includes(status))
    return res.status(400).json({ error: 'Status must be pending or completed' });
  if (dueDate && Number.isNaN(Date.parse(dueDate)))
    return res.status(400).json({ error: 'Invalid due date' });
  if (dueTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(dueTime))
    return res.status(400).json({ error: 'Invalid due time' });
  if (category !== undefined && !CATEGORIES.includes(category))
    return res.status(400).json({ error: 'Invalid category' });
  next();
}

module.exports = { validateTask };

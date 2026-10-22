// models/Task.js - data layer for tasks (the C, R, U, D of CRUD)
const crypto = require('crypto');
const { load, save } = require('./db');

const Task = {
  all(userId) {                                   // READ (all)
    return load('tasks').filter(t => t.userId === userId);
  },
  create(userId, data) {                          // CREATE
    const tasks = load('tasks');
    const task = {
      id: crypto.randomUUID(),
      userId,
      title: data.title,
      description: data.description || '',
      priority: data.priority || 'medium',
      status: data.status || 'pending',
      dueDate: data.dueDate || '',
      dueTime: data.dueTime || '',
      category: data.category || 'General',
      createdAt: new Date().toISOString()
    };
    tasks.push(task);
    save('tasks', tasks);
    return task;
  },
  update(userId, id, changes) {                   // UPDATE
    const tasks = load('tasks');
    const task = tasks.find(t => t.id === id && t.userId === userId);
    if (!task) return null;
    ['title', 'description', 'priority', 'status', 'dueDate', 'dueTime', 'category'].forEach(k => {
      if (changes[k] !== undefined) task[k] = changes[k];
    });
    save('tasks', tasks);
    return task;
  },
  remove(userId, id) {                            // DELETE
    const tasks = load('tasks');
    const next = tasks.filter(t => !(t.id === id && t.userId === userId));
    if (next.length === tasks.length) return false;
    save('tasks', next);
    return true;
  }
};

module.exports = Task;

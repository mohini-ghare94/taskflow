// models/User.js - users with hashed passwords (Node's built-in crypto, no extra package)
const crypto = require('crypto');
const { load, save } = require('./db');

function hash(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

const User = {
  findByUsername(username) {
    return load('users').find(u => u.username.toLowerCase() === username.toLowerCase());
  },
  create(username, password) {
    const users = load('users');
    const salt = crypto.randomBytes(16).toString('hex');
    const user = { id: crypto.randomUUID(), username, salt, passwordHash: hash(password, salt) };
    users.push(user);
    save('users', users);
    return user;
  },
  verify(user, password) {
    const a = Buffer.from(hash(password, user.salt), 'hex');
    const b = Buffer.from(user.passwordHash, 'hex');
    return crypto.timingSafeEqual(a, b);
  }
};

module.exports = User;

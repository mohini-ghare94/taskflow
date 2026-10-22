// models/db.js - tiny file-based database (JSON files inside /data)
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'data');

function file(name) {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
  const f = path.join(DIR, name + '.json');
  if (!fs.existsSync(f)) fs.writeFileSync(f, '[]');
  return f;
}
const load = (name) => JSON.parse(fs.readFileSync(file(name), 'utf8'));
const save = (name, data) => fs.writeFileSync(file(name), JSON.stringify(data, null, 2));

module.exports = { load, save };

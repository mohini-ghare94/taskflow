# TaskFlow - Task Management Web App

Micro-project: CRUD task manager built with Node.js + Express, vanilla JavaScript front-end, and XML import/export.

## Run it
```
npm install
npm start
```
Open http://localhost:3000 -> create an account -> add tasks.

## Folder structure (what each file does)
| File | Role |
|---|---|
| `index.js` | Entry point. Starts Express, loads middleware + routers |
| `routes/auth.js` | Register / login / logout routes |
| `routes/tasks.js` | CRUD routes + XML export route |
| `models/Task.js`, `models/User.js` | Data models (what a task/user is, how it is saved) |
| `models/db.js` | The "database": JSON files in `/data` |
| `middleware/auth.js` | Verification: blocks requests with no valid token |
| `middleware/validate.js` | Validates task data on the server |
| `public/index.html, style.css, app.js` | Front-end |

## Course Outcomes - where each one is used
**CO1 - JavaScript for web development:** `public/app.js` - variables, arrays (filter/sort/map), objects, arrow functions, async/await, template strings, localStorage.
**CO2 - Client-side scripting:** `public/app.js` - DOM manipulation (createElement, textContent), event listeners (click, submit, input, change), form validation before sending, fetch() calls, live search and filter without page reload.
**CO3 - Server-side programming:** `routes/`, `models/`, `middleware/` - request handling, validation, authentication, password hashing, saving data in a database, JSON responses with status codes (200, 201, 400, 401, 404, 409).
**CO4 - XML for web development:** Server generates XML at `GET /api/tasks/export/xml` (`routes/tasks.js`). Client parses uploaded XML with `DOMParser` (`app.js`, Import XML) and creates tasks from it.
**CO5 - Node.js:** `index.js` + `package.json` - Node runtime, Express framework, modules (`require`/`module.exports`), built-in `fs`, `path`, `crypto`, npm.

## How a request flows (explain this to ma'am)
Browser click -> `app.js` validates -> `fetch('/api/tasks')` -> `index.js` -> `requireAuth` middleware checks the token -> `validateTask` middleware checks data -> route in `routes/tasks.js` -> `models/Task.js` reads/writes `data/tasks.json` -> JSON goes back -> `app.js` re-renders the list.

## Likely viva questions
1. What is middleware? A function that runs between request and route handler; it can stop the request (`res.status(401)`) or pass on (`next()`).
2. What is CRUD? Create=POST, Read=GET, Update=PUT, Delete=DELETE.
3. Why validate on both client and server? Client = fast feedback for the user. Server = real protection, because anyone can bypass the browser.
4. Why hash passwords? So a leaked file doesn't expose real passwords. We use `scrypt` with a random salt per user.
5. Why `textContent` not `innerHTML` for titles? Stops XSS (a user typing `<script>` as a title).
6. What is XML vs JSON? Both store structured data; XML uses tags and is still used for config, feeds, and data exchange between systems.
7. Why a JSON file and not MongoDB? Zero setup for a micro-project. Only `models/` would change to move to MongoDB, routes stay the same.

// app.js - client-side scripting: DOM, events, validation, fetch (AJAX), XML parsing
const $ = (sel) => document.querySelector(sel);

let token = localStorage.getItem('token');
let username = localStorage.getItem('username');
let tasks = [];
let filter = 'all';
let catFilter = 'all';
let editingId = null;
let registerMode = false;

/* ---------- helper: talk to the Node/Express server ---------- */
async function api(path, options = {}) {
  const res = await fetch('/api' + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    }
  });
  const isXml = (res.headers.get('content-type') || '').includes('xml');
  const data = isXml ? await res.text() : await res.json().catch(() => ({}));
  if (res.status === 401 && token) { logout(); throw new Error('Session expired, please log in again'); }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

/* ---------- AUTH ---------- */
function showApp(loggedIn) {
  $('#auth').classList.toggle('hidden', loggedIn);
  $('#app').classList.toggle('hidden', !loggedIn);
  if (loggedIn) { $('#welcome').textContent = 'Hi, ' + username; loadTasks(); }
}

$('#authToggle').addEventListener('click', (e) => {
  e.preventDefault();
  registerMode = !registerMode;
  $('#authBtn').textContent = registerMode ? 'Create account' : 'Sign in';
  $('#authSub').textContent = registerMode ? 'Create your free account' : 'Sign in to manage your tasks';
  $('#authToggleText').textContent = registerMode ? 'Already registered?' : 'New here?';
  $('#authToggle').textContent = registerMode ? 'Sign in' : 'Create an account';
  $('#authError').textContent = '';
});

$('#authForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const u = $('#username').value.trim(), p = $('#password').value;
  // client-side validation (runs before anything is sent to the server)
  if (u.length < 3) return ($('#authError').textContent = 'Username must be at least 3 characters');
  if (p.length < 6) return ($('#authError').textContent = 'Password must be at least 6 characters');
  try {
    const data = await api(registerMode ? '/auth/register' : '/auth/login',
      { method: 'POST', body: JSON.stringify({ username: u, password: p }) });
    token = data.token; username = data.username;
    localStorage.setItem('token', token); localStorage.setItem('username', username);
    $('#authForm').reset(); $('#authError').textContent = '';
    showApp(true);
  } catch (err) { $('#authError').textContent = err.message; }
});

function logout() {
  if (token) fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + token } }).catch(() => {});
  token = null; username = null; tasks = [];
  localStorage.removeItem('token'); localStorage.removeItem('username');
  showApp(false);
}
$('#logoutBtn').addEventListener('click', logout);

/* ---------- READ + RENDER ---------- */
async function loadTasks() {
  try { tasks = await api('/tasks'); render(); }
  catch (err) { toast(err.message); }
}

const today = () => new Date().toISOString().slice(0, 10);
const isOverdue = (t) => t.status === 'pending' && t.dueDate &&
  new Date(`${t.dueDate}T${t.dueTime || '23:59'}`) < new Date();

function render() {
  const q = $('#search').value.trim().toLowerCase();
  const shown = tasks
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => catFilter === 'all' || (t.category || 'General') === catFilter)
    .filter(t => !q || (t.title + ' ' + t.description).toLowerCase().includes(q))
    .sort((a, b) => ((a.dueDate || '9999') + (a.dueTime || '')).localeCompare((b.dueDate || '9999') + (b.dueTime || '')));

  $('#statTotal').textContent = tasks.length;
  $('#statPending').textContent = tasks.filter(t => t.status === 'pending').length;
  $('#statDone').textContent = tasks.filter(t => t.status === 'completed').length;
  $('#statOverdue').textContent = tasks.filter(isOverdue).length;

  const list = $('#list');
  list.innerHTML = '';
  $('#empty').classList.toggle('hidden', shown.length > 0);

  shown.forEach(t => {
    const card = document.createElement('article');
    card.className = `task ${t.priority} ${t.status === 'completed' ? 'done' : ''}`;

    const check = document.createElement('input');
    check.type = 'checkbox'; check.checked = t.status === 'completed';
    check.addEventListener('change', () => updateTask(t.id, { status: check.checked ? 'completed' : 'pending' }));

    const body = document.createElement('div'); body.className = 'body';
    const h3 = document.createElement('h3'); h3.textContent = t.title;          // textContent = safe from XSS
    const p = document.createElement('p'); p.textContent = t.description;
    const meta = document.createElement('div'); meta.className = 'meta';
    meta.innerHTML = `<span class="badge ${t.priority}">${t.priority}</span>`;
    meta.innerHTML += `<span class="badge">${t.category || 'General'}</span>`;
    if (t.dueDate) meta.innerHTML += `<span class="badge">Due ${t.dueDate}${t.dueTime ? ' ' + t.dueTime : ''}</span>`;
    if (isOverdue(t)) meta.innerHTML += `<span class="badge overdue">Overdue</span>`;
    body.append(h3); if (t.description) body.append(p); body.append(meta);

    const icons = document.createElement('div'); icons.className = 'icons';
    const edit = document.createElement('button'); edit.className = 'icon-btn'; edit.textContent = 'Edit';
    edit.addEventListener('click', () => openModal(t));
    const del = document.createElement('button'); del.className = 'icon-btn del'; del.textContent = 'Delete';
    del.addEventListener('click', () => deleteTask(t.id));
    icons.append(edit, del);

    card.append(check, body, icons);
    list.append(card);
  });
}

$('#tabs').addEventListener('click', (e) => {
  if (!e.target.dataset.filter) return;
  filter = e.target.dataset.filter;
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b === e.target));
  render();
});
$('#search').addEventListener('input', render);
$('#catFilter').addEventListener('change', (e) => { catFilter = e.target.value; render(); });

/* ---------- CREATE / UPDATE / DELETE ---------- */
function openModal(task = null) {
  editingId = task ? task.id : null;
  $('#modalTitle').textContent = task ? 'Edit task' : 'New task';
  $('#fTitle').value = task ? task.title : '';
  $('#fDesc').value = task ? task.description : '';
  $('#fPriority').value = task ? task.priority : 'medium';
  $('#fDue').value = task ? task.dueDate : '';
  $('#fTime').value = task ? (task.dueTime || '') : '';
  $('#fCategory').value = task ? (task.category || 'General') : 'General';
  $('#formError').textContent = '';
  $('#modal').classList.remove('hidden');
  $('#fTitle').focus();
}
const closeModal = () => $('#modal').classList.add('hidden');
$('#addBtn').addEventListener('click', () => openModal());
$('#cancelBtn').addEventListener('click', closeModal);
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

$('#taskForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    title: $('#fTitle').value.trim(),
    description: $('#fDesc').value.trim(),
    priority: $('#fPriority').value,
    category: $('#fCategory').value,
    dueDate: $('#fDue').value,
    dueTime: $('#fTime').value
  };
  if (body.title.length < 3) return ($('#formError').textContent = 'Title must be at least 3 characters');
  try {
    if (editingId) await api('/tasks/' + editingId, { method: 'PUT', body: JSON.stringify(body) });
    else await api('/tasks', { method: 'POST', body: JSON.stringify(body) });
    closeModal(); toast(editingId ? 'Task updated' : 'Task added'); loadTasks();
  } catch (err) { $('#formError').textContent = err.message; }
});

async function updateTask(id, changes) {
  try { await api('/tasks/' + id, { method: 'PUT', body: JSON.stringify(changes) }); loadTasks(); }
  catch (err) { toast(err.message); }
}
async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try { await api('/tasks/' + id, { method: 'DELETE' }); toast('Task deleted'); loadTasks(); }
  catch (err) { toast(err.message); }
}

/* ---------- XML EXPORT / IMPORT ---------- */
$('#exportBtn').addEventListener('click', async () => {
  try {
    const xml = await api('/tasks/export/xml');             // server builds the XML
    const url = URL.createObjectURL(new Blob([xml], { type: 'application/xml' }));
    const a = document.createElement('a'); a.href = url; a.download = 'tasks.xml'; a.click();
    URL.revokeObjectURL(url); toast('Exported tasks.xml');
  } catch (err) { toast(err.message); }
});

$('#importBtn').addEventListener('click', () => $('#importFile').click());
$('#importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0]; if (!file) return;
  const doc = new DOMParser().parseFromString(await file.text(), 'application/xml');   // client parses XML
  if (doc.querySelector('parsererror')) { toast('Invalid XML file'); e.target.value = ''; return; }
  const get = (node, tag) => (node.querySelector(tag)?.textContent || '').trim();
  let count = 0;
  for (const node of doc.querySelectorAll('task')) {
    try {
      await api('/tasks', { method: 'POST', body: JSON.stringify({
        title: get(node, 'title'), description: get(node, 'description'),
        priority: get(node, 'priority') || 'medium', status: get(node, 'status') || 'pending',
        dueDate: get(node, 'dueDate'), dueTime: get(node, 'dueTime'),
        category: get(node, 'category') || 'General'
      })});
      count++;
    } catch (_) { /* skip invalid entries */ }
  }
  e.target.value = ''; toast(`Imported ${count} task(s)`); loadTasks();
});

/* ---------- DARK MODE ---------- */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  $('#themeBtn').textContent = theme === 'dark' ? '☀ Light' : '🌙 Dark';
}
$('#themeBtn').addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  applyTheme(next);
});
applyTheme(localStorage.getItem('theme') || 'light');

/* ---------- start ---------- */
showApp(!!token);

/**
 * KalaaKart Platform — Shared API helper
 * Wraps fetch with base URL + auth header injection
 */

const API = 'http://localhost:3001';

function getToken() { return localStorage.getItem('kk_token'); }
function getUser()  {
  try { return JSON.parse(localStorage.getItem('kk_user')); } catch { return null; }
}
function setSession(token, user) {
  localStorage.setItem('kk_token', token);
  localStorage.setItem('kk_user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('kk_token');
  localStorage.removeItem('kk_user');
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res  = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const api = {
  get : (path)        => apiFetch(path),
  post: (path, body)  => apiFetch(path, { method: 'POST',  body: JSON.stringify(body) }),
  patch:(path, body)  => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
};

// ── Toast ────────────────────────────────────────────────────────────────────

function showToast(msg, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const t    = document.createElement('div');
  t.className = `toast ${type}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

// ── Auth guard (call on protected pages) ─────────────────────────────────────

function requireAuth() {
  const token = getToken();
  if (!token) { window.location.href = '/platform/auth/login.html'; return false; }
  return true;
}

// ── Redirect if already logged in ────────────────────────────────────────────

function redirectIfLoggedIn() {
  if (getToken()) window.location.href = '/platform/index.html';
}

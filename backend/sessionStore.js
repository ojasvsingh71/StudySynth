import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'sessions.json');

let store = {};
// load previous if exists
try {
  if (fs.existsSync(DB_FILE)) {
    store = JSON.parse(fs.readFileSync(DB_FILE, 'utf8') || '{}');
  }
} catch (e) {
  console.error('Failed to load sessions.json', e);
}

export function saveStore() {
  fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2));
}

export function createSession(session) {
  store[session.id] = session;
  saveStore();
}

export function updateSession(id, patch) {
  store[id] = { ...(store[id] || {}), ...patch };
  saveStore();
}

export function appendEvent(id, event) {
  const s = store[id] || {};
  s.events = s.events || [];
  s.events.push(event);
  store[id] = s;
  saveStore();
}

export function getSession(id) {
  return store[id];
}

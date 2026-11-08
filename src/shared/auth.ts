// Demo authentication: accounts live in this browser's localStorage.
// Passwords are never stored as typed — only a salted SHA-256 hash.
// This is a front-end demo gate, not real security: a production version needs a server (e.g. Netlify Identity or Supabase).

export type Session = { email: string; name: string; winery: string; at: string };
type Account = { name: string; winery: string; salt: string; hash: string; created: string };

const USERS = 'terroir-users';
export const SESSION = 'terroir-session';

function readUsers(): Record<string, Account> {
  try { return JSON.parse(localStorage.getItem(USERS) || '{}') || {}; } catch { return {}; }
}
function writeUsers(u: Record<string, Account>) {
  try { localStorage.setItem(USERS, JSON.stringify(u)); } catch { /* storage unavailable */ }
}

async function hash(salt: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(salt + ':' + password);
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback when Web Crypto is unavailable (e.g. a file opened from disk): FNV-1a, still never plain text.
  let h = 0x811c9dc5;
  for (const b of data) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
  return 'fnv' + h.toString(16);
}
function randomSalt() {
  const a = new Uint8Array(12);
  try { crypto.getRandomValues(a); } catch { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); }
  return Array.from(a).map((b) => b.toString(16).padStart(2, '0')).join('');
}
const norm = (email: string) => email.trim().toLowerCase();

export function getSession(): Session | null {
  try { const s = JSON.parse(localStorage.getItem(SESSION) || 'null'); return s && s.email ? s : null; } catch { return null; }
}
function setSession(s: Session) {
  try { localStorage.setItem(SESSION, JSON.stringify(s)); } catch { /* ignore */ }
}
export function signOut() {
  try { localStorage.removeItem(SESSION); } catch { /* ignore */ }
}

export type AuthError = 'exists' | 'unknown' | 'wrong';

export async function signUp(name: string, winery: string, email: string, password: string): Promise<Session | AuthError> {
  const users = readUsers();
  const key = norm(email);
  if (users[key]) return 'exists';
  const salt = randomSalt();
  users[key] = { name: name.trim(), winery: winery.trim(), salt, hash: await hash(salt, password), created: new Date().toISOString() };
  writeUsers(users);
  const s = { email: key, name: name.trim(), winery: winery.trim(), at: new Date().toISOString() };
  setSession(s);
  return s;
}

export async function logIn(email: string, password: string): Promise<Session | AuthError> {
  const users = readUsers();
  const key = norm(email);
  const u = users[key];
  if (!u) return 'unknown';
  if ((await hash(u.salt, password)) !== u.hash) return 'wrong';
  const s = { email: key, name: u.name, winery: u.winery, at: new Date().toISOString() };
  setSession(s);
  return s;
}

/**
 * Student identity management.
 *
 * Uses a persistent client-generated UUID v4 capability token stored in localStorage.
 * No passwords, accounts, or PII.
 */

const TOKEN_KEY = 'pythagoras-student-token';
const NAME_KEY = 'pythagoras-student-name';
const REGISTERED_KEY = 'pythagoras-student-registered';

/**
 * Returns the persistent UUID capability token for this browser.
 * Generates and saves a new UUID v4 if not already present.
 */
export function getStudentToken(): string {
  if (typeof window === 'undefined') {
    return '00000000-0000-4000-a000-000000000000';
  }

  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

/**
 * Retrieves the optional student display name from localStorage.
 */
export function getDisplayName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(NAME_KEY) || '';
}

/**
 * Updates the student display name in localStorage.
 */
export function setDisplayName(name: string): void {
  if (typeof window === 'undefined') return;
  const sanitized = name.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 24);
  localStorage.setItem(NAME_KEY, sanitized);
  // Mark need re-register if name changed
  localStorage.removeItem(REGISTERED_KEY);
}

/**
 * Ensures the student row is created/updated in the database (fire-and-forget).
 */
export function ensureStudentRegistered(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(REGISTERED_KEY) === 'true') return;

  const token = getStudentToken();
  const displayName = getDisplayName() || undefined;

  fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, displayName }),
  })
    .then((res) => {
      if (res.ok) {
        localStorage.setItem(REGISTERED_KEY, 'true');
      }
    })
    .catch((err) => {
      console.warn('[Identity] registration delayed, will retry on next action:', err);
    });
}

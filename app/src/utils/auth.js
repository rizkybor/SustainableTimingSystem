const KEY = 'app_key_ok';

export function isUnlocked() {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch (_) {
    return false;
  }
}

export function unlock() {
  try {
    localStorage.setItem(KEY, '1');
  } catch (_) {}
}

export function lock() {
  try {
    localStorage.removeItem(KEY);
  } catch (_) {}
}
export type AuthRole = 'user' | 'admin';

const AUTH_HEADER_STORAGE_KEY = 'debug-master.auth.header';
const AUTH_ROLE_STORAGE_KEY = 'debug-master.auth.role';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}

export function buildBasicAuthHeader(username: string, password: string): string {
  return `Basic ${encodeBase64(`${username}:${password}`)}`;
}

export function getStoredAuthHeader(): string | null {
  if (!isBrowser()) {
    return null;
  }
  return window.sessionStorage.getItem(AUTH_HEADER_STORAGE_KEY);
}

export function getStoredRole(): AuthRole | null {
  if (!isBrowser()) {
    return null;
  }
  const role = window.sessionStorage.getItem(AUTH_ROLE_STORAGE_KEY);
  if (role === 'user' || role === 'admin') {
    return role;
  }
  return null;
}

export function setStoredAuth(authHeader: string, role: AuthRole): void {
  if (!isBrowser()) {
    return;
  }
  window.sessionStorage.setItem(AUTH_HEADER_STORAGE_KEY, authHeader);
  window.sessionStorage.setItem(AUTH_ROLE_STORAGE_KEY, role);
}

export function clearStoredAuth(): void {
  if (!isBrowser()) {
    return;
  }
  window.sessionStorage.removeItem(AUTH_HEADER_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
}

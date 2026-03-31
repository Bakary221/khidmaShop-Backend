import type { Request } from 'express';

export const ACCESS_TOKEN_COOKIE = 'khidma_access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const ROLE_COOKIE = 'khidma_role';

function normalizeCookieHeader(cookieHeader?: string) {
  if (!cookieHeader) {
    return [];
  }

  return cookieHeader
    .split(';')
    .map((section) => section.trim())
    .filter(Boolean);
}

export function getCookieValue(cookieHeader: string | undefined, name: string): string | null {
  const cookies = normalizeCookieHeader(cookieHeader);
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  if (!match) {
    return null;
  }

  const [, value] = match.split('=');
  return value ? decodeURIComponent(value) : null;
}

export function getCookieFromRequest(request: Request, name: string): string | null {
  return getCookieValue(request.headers.cookie, name);
}

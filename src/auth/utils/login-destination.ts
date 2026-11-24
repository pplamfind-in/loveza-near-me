import { getSafeRedirectPath } from './safe-redirect';

export function getLoginDestination(next: string | undefined, kind: string) {
  const defaultPath = kind === 'merchant' ? '/account/merchant' : '/account';

  const origin = 'https://loveza.invalid';
  const path = getSafeRedirectPath(typeof next === 'string' ? next : undefined, defaultPath);
  let url: URL;
  try {
    url = new URL(path, origin);
  } catch {
    return defaultPath;
  }
  if (
    url.origin !== origin ||
    url.pathname.startsWith('//') ||
    /^\/(admin|auth)(?:\/|$)/i.test(url.pathname)
  )
    return defaultPath;
  if (kind === 'merchant' && /^\/account\/?$/.test(url.pathname)) return defaultPath;
  return `${url.pathname}${url.search}${url.hash}`;
}

import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const USER_PROTECTED_ROUTES = ['/account', '/report', '/history'];
const USER_APP_ROUTES = ['/', '/account', '/report', '/history', '/nearby', '/auth/login'];
const ADMIN_ROUTES = ['/admin'];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (user?.app_metadata.role === 'admin' && matchesRoute(pathname, USER_APP_ROUTES)) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (matchesRoute(pathname, USER_PROTECTED_ROUTES) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`;
    return NextResponse.redirect(url);
  }

  if (matchesRoute(pathname, ADMIN_ROUTES)) {
    if (!user || user.app_metadata.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/account/:path*',
    '/report/:path*',
    '/history/:path*',
    '/nearby/:path*',
    '/auth/login',
    '/admin/:path*',
  ],
};

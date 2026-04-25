import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Define protected routes
  const protectedRoutes = [
    '/profile',
    '/black-market',
    '/trade-routes',
    '/price-checker',
    '/tutorial'
  ];

  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  // If the route is protected and there is no session, redirect to login
  if (isProtectedRoute && !session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    // Optionally add a 'next' param to redirect back after login
    redirectUrl.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Specify the routes where the middleware should run
export const config = {
  matcher: [
    '/profile/:path*',
    '/black-market/:path*',
    '/trade-routes/:path*',
    '/price-checker/:path*',
    '/tutorial/:path*'
  ],
};

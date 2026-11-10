import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('etambo_token')?.value;
  const role = request.cookies.get('etambo_role')?.value;
  const businessSlug = request.cookies.get('etambo_business_slug')?.value;
  const path = request.nextUrl.pathname;

  if (path === '/' && token) {
    if (role === 'SUPERADMIN') {
      return NextResponse.redirect(new URL('/dashboard/businesses', request.url));
    }
    if (businessSlug) {
      return NextResponse.redirect(new URL(`/b/${businessSlug}/dashboard/pos`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
  ],
};

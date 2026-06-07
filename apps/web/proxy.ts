import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_super_secret_key_for_prodtrack_app'
);

export async function proxy(request: NextRequest) {
  // Define protected routes
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/home-panel');

  if (isProtectedRoute) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      // Redirect to login if no token is found
      return NextResponse.redirect(new URL('/Login', request.url));
    }

    try {
      // Verify token
      await jwtVerify(token, JWT_SECRET);
      
      // If valid, allow request to proceed
      return NextResponse.next();
    } catch (error) {
      // Redirect to login if token is invalid or expired
      return NextResponse.redirect(new URL('/Login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/home-panel/:path*'],
};

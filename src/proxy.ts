import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Next 16 "proxy" (formerly middleware): gate signed-in areas and teacher-only pages.
const TEACHER_ONLY = ['/tuitions/new'];

export default withAuth(
  function proxy(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    if (TEACHER_ONLY.some((p) => pathname.startsWith(p)) && role !== 'teacher') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: '/auth/signin' },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tuitions/:path*',
    '/homework/:path*',
    '/payments/:path*',
    '/profile/:path*',
  ],
};

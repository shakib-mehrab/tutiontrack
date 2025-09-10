import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Protect dashboard routes
    if (pathname.startsWith('/dashboard')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url));
      }

      // Role-based access control
      if (pathname.startsWith('/dashboard/teacher') && token.role !== 'teacher') {
        return NextResponse.redirect(new URL('/dashboard/student', req.url));
      }

      if (pathname.startsWith('/dashboard/student') && token.role !== 'student') {
        return NextResponse.redirect(new URL('/dashboard/teacher', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages without token
        if (req.nextUrl.pathname.startsWith('/auth')) {
          return true;
        }
        // Require token for protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/api/tuitions/:path*'],
};

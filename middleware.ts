import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is authenticated for protected routes
        const { pathname } = req.nextUrl;
        
        // Allow access to auth pages
        if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
          return true;
        }
        
        // Require authentication for dashboard and API routes
        if (pathname.startsWith('/dashboard') || pathname.includes('/(dashboard)') || pathname.startsWith('/api/')) {
          // Skip auth check for NextAuth API routes and signup
          if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/auth/signup')) {
            return true;
          }
          return !!token;
        }
        
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/(dashboard)/:path*',
    '/api/:path*',
    '/login',
    '/signup'
  ]
};
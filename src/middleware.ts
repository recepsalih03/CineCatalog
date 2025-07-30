import { withAuth } from 'next-auth/middleware';
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { securityHeaders } from "./lib/security"

export default withAuth(
  function middleware(req: NextRequest) {
    const response = NextResponse.next()
    
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    if (req.nextUrl.pathname.startsWith('/admin')) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
      response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')
    }

    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname === '/admin/login') {
          return true;
        }
        
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return !!token;
        }
        
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/((?!api|_next/static|_next/image|movie.ico).*)']
};
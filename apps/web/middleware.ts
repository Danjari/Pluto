import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/signin") || 
                      req.nextUrl.pathname.startsWith("/signup");

    console.log("Middleware:", {
      pathname: req.nextUrl.pathname,
      isAuth,
      isAuthPage,
      hasToken: !!token
    });

    // Redirect authenticated users away from auth pages to dashboard
    if (isAuth && isAuthPage) {
      console.log("Redirecting authenticated user from auth page to dashboard");
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Redirect unauthenticated users to main page for protected routes
    if (!isAuth && !isAuthPage && req.nextUrl.pathname !== "/" && !req.nextUrl.pathname.startsWith("/api")) {
      console.log("Redirecting unauthenticated user to main page");
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to public routes
        if (pathname === "/" || 
            pathname.startsWith("/signin") || 
            pathname.startsWith("/signup") ||
            pathname.startsWith("/api/auth")) {
          return true;
        }
        
        // Require authentication for all other routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

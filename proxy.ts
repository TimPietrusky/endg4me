import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

export default authkitMiddleware({
  // Routes that don't require authentication
  publicPaths: ["/", "/api/health"],
});

export const config = {
  matcher: [
    // Match all routes except static files and api routes that should be public
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};


import { handleAuth } from "@workos-inc/authkit-nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authHandler = handleAuth({ returnPathname: "/operate" });
  const response = await authHandler(request);
  
  // Check if the response is a JSON error (WorkOS returns JSON errors with status 500)
  if (response.status >= 400) {
    try {
      const clonedResponse = response.clone();
      const body = await clonedResponse.json();
      
      // If it's an error response, redirect to home with error message
      if (body.error) {
        const message = encodeURIComponent(
          body.error.description || body.error.message || "Authentication failed"
        );
        const baseUrl = new URL(request.url).origin;
        return NextResponse.redirect(`${baseUrl}/?error=auth_failed&message=${message}`);
      }
    } catch {
      // If parsing fails, still redirect with generic error
      const baseUrl = new URL(request.url).origin;
      return NextResponse.redirect(`${baseUrl}/?error=auth_failed&message=Authentication+failed`);
    }
  }
  
  return response;
}


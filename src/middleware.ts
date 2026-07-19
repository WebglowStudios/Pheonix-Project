import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Admin routes protection is handled client-side in layout
  // This middleware just passes through
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

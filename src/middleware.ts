import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isServerActionPost(req: NextRequest): boolean {
  return req.method === "POST" && req.headers.has("next-action");
}

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sync-user",
  "/api/indexing-worker(.*)",
  "/api/gumroad-webhook(.*)",
  "/api/webhooks(.*)",
  "/api/clerk(.*)",
  "/readme/(.*)",
  "/docs/(.*)",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/pricing",
  "/documentation",
  "/changelog",
  "/api",
  "/careers",
  "/blog",
  "/security",
  "/status",
]);

const isDev = process.env.NODE_ENV === "development";

export default clerkMiddleware(
  async (auth, req) => {
    if (isServerActionPost(req)) {
      await auth();
      return NextResponse.next();
    }

    const { userId } = await auth();
    if (userId && req.nextUrl.pathname.startsWith("/sign-in")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
  },
  {

    clockSkewInMs: isDev ? 30_000 : 5_000,
  }
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

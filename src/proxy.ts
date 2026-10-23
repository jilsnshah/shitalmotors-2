import { NextResponse, type NextRequest } from "next/server";
import slugs from "@/content/generated/slugs.json";

const known: Record<string, Set<string>> = {
  cars: new Set(slugs.cars),
  commercial: new Set(slugs.commercial),
  legal: new Set(["privacy", "terms", "disclaimer"]),
};

/**
 * Model and legal pages are fully prerendered for every known slug. Unknown
 * slugs are rewritten to an unmatched path so they get the not-found page
 * with a real HTTP 404 (instead of a 200 streamed from the route's shell).
 */
export function proxy(request: NextRequest) {
  const [, section, slug] = request.nextUrl.pathname.split("/");
  if (known[section] && slug && !known[section].has(slug)) {
    return NextResponse.rewrite(new URL("/__not-found", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/cars/:slug", "/commercial/:slug", "/legal/:doc"],
};

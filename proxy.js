// Clerk auth via the Next.js 16 proxy convention (formerly middleware).
// Public marketing pages and demo are open; only the workspace and sensitive APIs require auth.
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { hasClerk } from './lib/config';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/demo(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/robots.txt',
  '/sitemap.xml',
  '/opengraph-image(.*)',
  '/api/enquiry(.*)',
  '/api/import/extract(.*)',
  '/api/product-image(.*)',
]);

const clerkHandler = clerkMiddleware(async (auth, req) => {
  // CSV validate/preview only — no persistence.
  if (req.nextUrl.pathname === '/api/import' && req.method === 'PUT') return;
  if (!isPublicRoute(req)) {
    const { userId, redirectToSignIn } = await auth();
    if (!userId) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }
  }
});

export default function proxy(req, evt) {
  if (!hasClerk) return NextResponse.next();
  return clerkHandler(req, evt);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

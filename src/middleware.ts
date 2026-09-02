import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/admin';
import { getClerkUserEmail } from '@/lib/auth';

const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)']);
const isCronRoute = createRouteMatcher(['/api/cron(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isCronRoute(req)) {
    return NextResponse.next();
  }

  if (isAdminRoute(req)) {
    const { userId } = await auth.protect();
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    const email = await getClerkUserEmail(userId);
    if (!isAdminEmail(email)) {
      return new NextResponse('Forbidden — admin only', { status: 403 });
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

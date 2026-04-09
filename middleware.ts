import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all routes EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - api/webhook (must be publicly accessible for Meta to POST to it)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/webhook).*)',
  ],
};

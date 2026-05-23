import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

const isProtectedApi = createRouteMatcher(['/api/comments']);

export const onRequest = clerkMiddleware((auth, context) => {
  if (isProtectedApi(context.request)) {
    const { userId } = auth();
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, message: 'Connexion requise.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
});

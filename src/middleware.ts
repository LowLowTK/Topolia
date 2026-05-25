import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

const isProtectedApi = createRouteMatcher(['/api/comments', '/api/article-ideas(.*)']);
const isProtectedPage = createRouteMatcher(['/admin/studio(.*)']);

export const onRequest = clerkMiddleware((auth, context) => {
  // Routes API protégées → 401 JSON si non connecté
  if (isProtectedApi(context.request)) {
    const { userId } = auth();
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, message: 'Connexion requise.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Pages admin protégées → redirect vers /login si non connecté
  if (isProtectedPage(context.request)) {
    const { userId } = auth();
    if (!userId) {
      return Response.redirect(new URL('/login', context.request.url));
    }
  }
});

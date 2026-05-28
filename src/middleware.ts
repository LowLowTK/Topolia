import type { MiddlewareHandler } from 'astro';

const clerkKey = import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
const clerkConfigured = clerkKey.startsWith('pk_test_') || clerkKey.startsWith('pk_live_');

async function buildMiddleware(): Promise<MiddlewareHandler> {
  if (!clerkConfigured) {
    // Clerk non configuré (dev local sans clés) — on laisse tout passer
    return (_, next) => next();
  }

  const { clerkMiddleware, createRouteMatcher } = await import('@clerk/astro/server');
  const isProtectedApi = createRouteMatcher(['/api/comments', '/api/article-ideas(.*)']);
  const isProtectedPage = createRouteMatcher(['/admin/studio(.*)']);

  return clerkMiddleware((auth, context) => {
    if (isProtectedApi(context.request)) {
      const { userId } = auth();
      if (!userId) {
        return new Response(JSON.stringify({ ok: false, message: 'Connexion requise.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    if (isProtectedPage(context.request)) {
      const { userId } = auth();
      if (!userId) {
        return Response.redirect(new URL('/login', context.request.url));
      }
    }
  });
}

export const onRequest: MiddlewareHandler = await buildMiddleware();

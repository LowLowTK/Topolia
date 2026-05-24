import type { APIRoute } from 'astro';
import { clerkClient } from '@clerk/astro/server';
import { validateCreateInput, insertComment, type CommentContentType } from '../../lib/comments';
import { notifyNewComment } from '../../lib/brevo-notify';

export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = locals.auth();
  const userId = auth?.userId;
  if (!userId) {
    return json({ ok: false, message: 'Connexion requise.' }, 401);
  }

  let body: { contentId?: unknown; contentType?: unknown; body?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: 'Corps JSON invalide.' }, 400);
  }

  const validation = validateCreateInput(body);
  if (validation) {
    return json({ ok: false, message: validation.message, field: validation.field }, 400);
  }

  const user = await clerkClient(locals as never).users.getUser(userId);
  const firstName = user.firstName?.trim() ?? '';
  const lastInitial = user.lastName?.trim()?.[0]?.toUpperCase() ?? '';
  const authorName = firstName
    ? lastInitial
      ? `${firstName} ${lastInitial}.`
      : firstName
    : 'Anonyme';

  try {
    const comment = await insertComment({
      contentId: body.contentId as string,
      contentType: body.contentType as CommentContentType,
      body: body.body as string,
      clerkUserId: userId,
      authorName,
    });

    const brevoKey = import.meta.env.BREVO_API_KEY;
    if (brevoKey) {
      await notifyNewComment(
        {
          contentType: comment.content_type,
          contentId: comment.content_id,
          authorName: comment.author_name,
          bodyPreview: comment.body.slice(0, 200),
        },
        brevoKey,
      );
    }
    return json({ ok: true, message: 'Commentaire reçu. Il sera publié après modération.' }, 201);
  } catch (err) {
    return json({ ok: false, message: (err as Error).message }, 500);
  }
};

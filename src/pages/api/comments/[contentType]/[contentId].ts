import type { APIRoute } from 'astro';
import { listApprovedComments, type CommentContentType } from '../../../../lib/comments';

export const prerender = false;

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' },
  });
}

export const GET: APIRoute = async ({ params }) => {
  const contentType = params.contentType;
  const contentId = params.contentId;

  if (contentType !== 'article' && contentType !== 'chantier') {
    return json({ ok: false, message: "contentType doit être 'article' ou 'chantier'." }, 400);
  }
  if (!contentId || contentId.length > 200 || !SLUG_REGEX.test(contentId)) {
    return json({ ok: false, message: 'contentId invalide.' }, 400);
  }

  try {
    const comments = await listApprovedComments(contentType as CommentContentType, contentId);
    return json({ ok: true, comments });
  } catch (err) {
    return json({ ok: false, message: (err as Error).message }, 500);
  }
};

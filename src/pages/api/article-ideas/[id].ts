// src/pages/api/article-ideas/[id].ts
import type { APIRoute } from 'astro';

export const prerender = false;
import {
  deleteArticleIdea,
  updateArticleStatus,
  type ArticleStatus,
} from '../../../lib/article-ideas';

const VALID_STATUSES: ArticleStatus[] = [
  'pending',
  'approved',
  'drafting',
  'draft',
  'published',
  'ignored',
];

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const { userId } = locals.auth();
  if (!userId) {
    return new Response(JSON.stringify({ ok: false, message: 'Non autorisé.' }), { status: 401 });
  }

  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ ok: false, message: 'ID manquant.' }), { status: 400 });
  }

  try {
    const body = await request.json();
    const { status } = body;

    if (!VALID_STATUSES.includes(status)) {
      return new Response(JSON.stringify({ ok: false, message: `Statut invalide : ${status}` }), {
        status: 400,
      });
    }

    const updated = await updateArticleStatus(id, status);
    return new Response(JSON.stringify({ ok: true, data: updated }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, message: String(err) }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { userId } = locals.auth();
  if (!userId) {
    return new Response(JSON.stringify({ ok: false, message: 'Non autorisé.' }), { status: 401 });
  }

  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ ok: false, message: 'ID manquant.' }), { status: 400 });
  }

  try {
    await deleteArticleIdea(id);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, message: String(err) }), { status: 500 });
  }
};

// src/pages/api/article-ideas/index.ts
import type { APIRoute } from 'astro';
import { createArticleIdea, listArticleIdeas } from '../../../lib/article-ideas';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const { userId } = locals.auth();
  if (!userId) {
    return new Response(JSON.stringify({ ok: false, message: 'Non autorisé.' }), { status: 401 });
  }

  try {
    const ideas = await listArticleIdeas();
    return new Response(JSON.stringify({ ok: true, data: ideas }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, message: String(err) }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const { userId } = locals.auth();
  if (!userId) {
    return new Response(JSON.stringify({ ok: false, message: 'Non autorisé.' }), { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, source_url, source_lang, source_name, excerpt } = body;

    if (!title || !source_url) {
      return new Response(
        JSON.stringify({ ok: false, message: 'title et source_url sont requis.' }),
        { status: 400 },
      );
    }

    const idea = await createArticleIdea({ title, source_url, source_lang, source_name, excerpt });
    return new Response(JSON.stringify({ ok: true, data: idea }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, message: String(err) }), { status: 500 });
  }
};

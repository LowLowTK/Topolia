import type { APIRoute } from 'astro';
import { subscribeContact } from '../../lib/brevo';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.BREVO_API_KEY;
  const listId = Number(import.meta.env.BREVO_LIST_ID ?? '0');

  if (!apiKey || !listId) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: 'Newsletter pas encore configurée (manque BREVO_API_KEY ou BREVO_LIST_ID).',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, message: 'Corps de requête invalide.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  if (!email) {
    return new Response(JSON.stringify({ ok: false, message: 'Email manquant.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await subscribeContact(email, listId, apiKey);
  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : result.status,
    headers: { 'Content-Type': 'application/json' },
  });
};

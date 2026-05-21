/**
 * Client minimal Brevo API v3 — inscription d'un contact à une liste.
 * Doc : https://developers.brevo.com/reference/createcontact
 */

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/contacts';

export interface BrevoSubscribeResult {
  ok: boolean;
  status: number;
  message: string;
}

export async function subscribeContact(
  email: string,
  listId: number,
  apiKey: string,
): Promise<BrevoSubscribeResult> {
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return { ok: false, status: 400, message: 'Email invalide.' };
  }

  try {
    const response = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        email,
        listIds: [listId],
        updateEnabled: true,
      }),
    });

    if (response.ok) {
      return {
        ok: true,
        status: response.status,
        message: 'Inscription enregistrée. À très vite par email.',
      };
    }

    const data: { message?: string } = await response.json().catch(() => ({}));
    if (response.status === 400 && /already/i.test(data?.message ?? '')) {
      return {
        ok: true,
        status: 200,
        message: 'Tu es déjà inscrit. Pas besoin de recommencer.',
      };
    }

    return {
      ok: false,
      status: response.status,
      message: data?.message ?? 'Erreur Brevo inconnue.',
    };
  } catch (err) {
    return {
      ok: false,
      status: 500,
      message: `Erreur réseau : ${(err as Error).message}`,
    };
  }
}

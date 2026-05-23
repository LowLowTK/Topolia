/**
 * Envoie un email transactionnel via Brevo pour notifier Loïc qu'un
 * nouveau commentaire est en attente de modération.
 */

const BREVO_SEND_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const MODERATOR_EMAIL = 'loicdu27620@gmail.com';
const FROM_EMAIL = 'noreply@topolia.fr';
const FROM_NAME = 'Topolia';

export interface ModerationNotice {
  contentType: 'article' | 'chantier';
  contentId: string;
  authorName: string;
  bodyPreview: string;
}

export interface NotifyResult {
  ok: boolean;
  message: string;
}

export async function notifyNewComment(
  notice: ModerationNotice,
  apiKey: string,
): Promise<NotifyResult> {
  const subject = `Nouveau commentaire en attente — ${notice.contentType}/${notice.contentId}`;
  const html = `
    <p>Un nouveau commentaire a été soumis et attend ta modération.</p>
    <ul>
      <li><strong>Auteur :</strong> ${escapeHtml(notice.authorName)}</li>
      <li><strong>Sur :</strong> ${notice.contentType}/${escapeHtml(notice.contentId)}</li>
    </ul>
    <blockquote>${escapeHtml(notice.bodyPreview)}</blockquote>
    <p>Ouvre le dashboard Supabase pour approuver ou rejeter.</p>
  `;

  try {
    const response = await fetch(BREVO_SEND_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: MODERATOR_EMAIL }],
        subject,
        htmlContent: html,
      }),
    });

    if (response.ok) {
      return { ok: true, message: 'Notification envoyée.' };
    }
    const data: { message?: string } = await response.json().catch(() => ({}));
    return { ok: false, message: data?.message ?? `Brevo error ${response.status}` };
  } catch (err) {
    return { ok: false, message: `Erreur réseau : ${(err as Error).message}` };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

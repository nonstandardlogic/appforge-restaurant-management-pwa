// CRITICAL: Only use pre-approved WhatsApp template IDs stored in env vars.
// Never create new templates — Meta approval required before any template can be used.
export function getWhatsAppTemplateId(alertType: string, locale: string): string {
  const templates: Record<string, Record<string, string | undefined>> = {
    daily_ca: {
      fr: process.env.BREVO_TEMPLATE_A1_FR,
      en: process.env.BREVO_TEMPLATE_A1_EN,
    },
    weekly_mb: {
      fr: process.env.BREVO_TEMPLATE_A2_FR,
      en: process.env.BREVO_TEMPLATE_A2_EN,
    },
  };
  const templateId = templates[alertType]?.[locale];
  if (!templateId) {
    throw new Error(`No WhatsApp template for alertType=${alertType} locale=${locale}`);
  }
  return templateId;
}

export async function sendBrevoWhatsApp(
  templateId: string,
  phone: string,
  params: Record<string, string | number>,
): Promise<string> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');

  const res = await fetch('https://api.brevo.com/v3/whatsapp/sendMessage', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId: Number(templateId), phoneNumber: phone, params }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo WhatsApp error ${res.status}: ${text}`);
  }

  const data = await res.json() as { messageId?: string };
  return data.messageId ?? 'ok';
}

export async function sendBrevoEmail(
  recipientEmail: string,
  subject: string,
  htmlContent: string,
): Promise<string> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');
  const senderEmail = process.env.BREVO_SENDER_EMAIL ?? 'noreply@appforge.io';
  const senderName = process.env.BREVO_SENDER_NAME ?? 'AppForge Alerts';

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: recipientEmail }],
      subject,
      htmlContent,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo Email error ${res.status}: ${text}`);
  }

  const data = await res.json() as { messageId?: string };
  return data.messageId ?? 'ok';
}

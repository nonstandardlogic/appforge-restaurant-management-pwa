import { getDb } from '@/lib/db/client';
import { getAlertConfig } from './config';
import { deliverWithRetry } from './delivery';
import { getWhatsAppTemplateId, sendBrevoWhatsApp, sendBrevoEmail } from './brevo';

export async function evaluateDailyCA(): Promise<{
  triggered: boolean;
  revenue: number;
  threshold: number;
}> {
  const config = await getAlertConfig('daily_ca');
  if (!config || !config.enabled) {
    return { triggered: false, revenue: 0, threshold: 0 };
  }

  const sql = getDb();
  const today = new Date().toISOString().split('T')[0];
  const rows = (await sql`
    SELECT COALESCE(SUM(total_amount), 0)::float AS revenue
    FROM orders
    WHERE created_at::date = ${today}
      AND status = 'completed'
  `) as unknown as Array<Record<string, unknown>>;

  const revenue = Number(rows[0]?.revenue ?? 0);
  const threshold = config.threshold;

  if (revenue >= threshold) {
    return { triggered: false, revenue, threshold };
  }

  const templateId = getWhatsAppTemplateId('daily_ca', config.locale);
  const params = {
    revenue: revenue.toFixed(2),
    threshold: threshold.toFixed(2),
    date: today,
  };

  await deliverWithRetry({
    alertType: 'daily_ca',
    channel: 'whatsapp',
    templateId,
    sendFn: () => sendBrevoWhatsApp(templateId, config.recipient_phone, params),
    payload: params,
  });

  const subject =
    config.locale === 'fr'
      ? `⚠️ CA du jour insuffisant — ${revenue.toFixed(2)} € (seuil : ${threshold.toFixed(2)} €)`
      : `⚠️ Daily revenue below target — ${revenue.toFixed(2)}€ (threshold: ${threshold.toFixed(2)}€)`;
  const htmlContent =
    config.locale === 'fr'
      ? `<p>Le chiffre d&#39;affaires du <strong>${today}</strong> est de <strong>${revenue.toFixed(2)} €</strong>, inférieur au seuil de <strong>${threshold.toFixed(2)} €</strong>.</p>`
      : `<p>Today&#39;s revenue (<strong>${today}</strong>) is <strong>${revenue.toFixed(2)}€</strong>, below the threshold of <strong>${threshold.toFixed(2)}€</strong>.</p>`;

  await deliverWithRetry({
    alertType: 'daily_ca',
    channel: 'email',
    templateId: 'smtp',
    sendFn: () => sendBrevoEmail(config.recipient_email, subject, htmlContent),
    payload: params,
  });

  return { triggered: true, revenue, threshold };
}

import { getDb } from '@/lib/db/client';
import { getAlertConfig } from './config';
import { deliverWithRetry } from './delivery';
import { getWhatsAppTemplateId, sendBrevoWhatsApp, sendBrevoEmail } from './brevo';

export async function evaluateWeeklyMB(): Promise<{
  triggered: boolean;
  mbPercent: number;
  threshold: number;
}> {
  const config = await getAlertConfig('weekly_mb');
  if (!config || !config.enabled) {
    return { triggered: false, mbPercent: 0, threshold: 0 };
  }

  const sql = getDb();

  // Deduplication: skip if an alert was already sent this ISO week (Monday–Sunday)
  const dedupRows = (await sql`
    SELECT COUNT(*)::int AS cnt
    FROM alerts_log
    WHERE alert_type = 'weekly_mb'
      AND status = 'sent'
      AND date_trunc('week', sent_at) = date_trunc('week', NOW())
  `) as unknown as Array<Record<string, unknown>>;

  if (Number(dedupRows[0]?.cnt ?? 0) > 0) {
    return { triggered: false, mbPercent: 0, threshold: 0 };
  }

  const now = new Date();
  const periodMonth = now.getMonth() + 1;
  const periodYear = now.getFullYear();

  const mbRows = (await sql`
    SELECT
      COALESCE(SUM(revenue), 0)::float AS total_revenue,
      COALESCE(SUM(gross_margin), 0)::float AS total_margin
    FROM financial_records
    WHERE period_month = ${periodMonth}
      AND period_year = ${periodYear}
  `) as unknown as Array<Record<string, unknown>>;

  const totalRevenue = Number(mbRows[0]?.total_revenue ?? 0);
  const totalMargin = Number(mbRows[0]?.total_margin ?? 0);
  const mbPercent = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;
  const threshold = config.threshold;

  if (mbPercent >= threshold) {
    return { triggered: false, mbPercent, threshold };
  }

  const templateId = getWhatsAppTemplateId('weekly_mb', config.locale);
  const params = {
    mb_percent: mbPercent.toFixed(1),
    threshold: threshold.toFixed(1),
    month: String(periodMonth),
    year: String(periodYear),
  };

  await deliverWithRetry({
    alertType: 'weekly_mb',
    channel: 'whatsapp',
    templateId,
    sendFn: () => sendBrevoWhatsApp(templateId, config.recipient_phone, params),
    payload: params,
  });

  const subject =
    config.locale === 'fr'
      ? `⚠️ Marge brute insuffisante — ${mbPercent.toFixed(1)} % (seuil : ${threshold.toFixed(1)} %)`
      : `⚠️ Gross margin below target — ${mbPercent.toFixed(1)}% (threshold: ${threshold.toFixed(1)}%)`;
  const htmlContent =
    config.locale === 'fr'
      ? `<p>La marge brute du mois en cours est de <strong>${mbPercent.toFixed(1)} %</strong>, inférieure au seuil de <strong>${threshold.toFixed(1)} %</strong>.</p>`
      : `<p>Current month gross margin is <strong>${mbPercent.toFixed(1)}%</strong>, below the threshold of <strong>${threshold.toFixed(1)}%</strong>.</p>`;

  await deliverWithRetry({
    alertType: 'weekly_mb',
    channel: 'email',
    templateId: 'smtp',
    sendFn: () => sendBrevoEmail(config.recipient_email, subject, htmlContent),
    payload: params,
  });

  return { triggered: true, mbPercent, threshold };
}

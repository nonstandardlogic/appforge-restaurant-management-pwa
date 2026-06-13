import { getDb } from '@/lib/db/client';

// Mutable object property — tests override retryDelaysMs without timer mocking
export const alertDeliveryConfig = {
  retryDelaysMs: [2000, 4000, 8000] as number[],
};

export interface DeliverOptions {
  alertType: string;
  channel: 'whatsapp' | 'email';
  templateId: string;
  sendFn: () => Promise<string>;
  payload: object;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function deliverWithRetry(opts: DeliverOptions): Promise<void> {
  const sql = getDb();
  const { alertType, channel, templateId, sendFn, payload } = opts;
  const delays = alertDeliveryConfig.retryDelaysMs;
  const maxAttempts = delays.length + 1;
  const payloadJson = JSON.stringify(payload);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const messageId = await sendFn();
      await (sql`
        INSERT INTO alerts_log (alert_type, channel, template_id, payload, status, message_id, sent_at)
        VALUES (${alertType}, ${channel}, ${templateId}, ${payloadJson}, 'sent', ${messageId}, NOW())
      ` as unknown as Promise<void>);
      return;
    } catch (err) {
      const isLastAttempt = attempt >= maxAttempts - 1;
      const status = isLastAttempt ? 'failed' : 'retrying';
      const errorMsg = err instanceof Error ? err.message : String(err);

      await (sql`
        INSERT INTO alerts_log (alert_type, channel, template_id, payload, status, error, sent_at)
        VALUES (${alertType}, ${channel}, ${templateId}, ${payloadJson}, ${status}, ${errorMsg}, NOW())
      ` as unknown as Promise<void>);

      if (isLastAttempt) {
        console.error(`[ALERT] Permanent failure alertType=${alertType} channel=${channel}: ${errorMsg}`);
        return;
      }

      await sleep(delays[attempt]);
    }
  }
}

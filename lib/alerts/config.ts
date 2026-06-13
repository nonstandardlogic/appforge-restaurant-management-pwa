import { getDb } from '@/lib/db/client';

export interface AlertConfig {
  alert_type: string;
  enabled: boolean;
  threshold: number;
  recipient_email: string;
  recipient_phone: string;
  locale: string;
  updated_at: string;
}

export async function getAlertConfig(alertType: string): Promise<AlertConfig | null> {
  const sql = getDb();
  const rows = (await sql`
    SELECT * FROM alert_configs WHERE alert_type = ${alertType}
  `) as unknown as Array<Record<string, unknown>>;
  if (rows.length === 0) return null;
  return rows[0] as unknown as AlertConfig;
}

export async function getAllAlertConfigs(): Promise<AlertConfig[]> {
  const sql = getDb();
  const rows = (await sql`
    SELECT * FROM alert_configs ORDER BY alert_type
  `) as unknown as Array<Record<string, unknown>>;
  return rows as unknown as AlertConfig[];
}

export async function updateAlertConfig(
  alertType: string,
  updates: Partial<Omit<AlertConfig, 'alert_type' | 'updated_at'>>,
): Promise<AlertConfig> {
  const sql = getDb();
  const enabledVal = updates.enabled !== undefined ? updates.enabled : null;
  const thresholdVal = updates.threshold !== undefined ? updates.threshold : null;
  const emailVal = updates.recipient_email !== undefined ? updates.recipient_email : null;
  const phoneVal = updates.recipient_phone !== undefined ? updates.recipient_phone : null;
  const localeVal = updates.locale !== undefined ? updates.locale : null;

  const rows = (await sql`
    INSERT INTO alert_configs (alert_type, enabled, threshold, recipient_email, recipient_phone, locale, updated_at)
    VALUES (
      ${alertType},
      COALESCE(${enabledVal}::boolean, true),
      COALESCE(${thresholdVal}::float, 0),
      COALESCE(${emailVal}, ''),
      COALESCE(${phoneVal}, ''),
      COALESCE(${localeVal}, 'fr'),
      NOW()
    )
    ON CONFLICT (alert_type) DO UPDATE SET
      enabled     = COALESCE(${enabledVal}::boolean,    alert_configs.enabled),
      threshold   = COALESCE(${thresholdVal}::float,    alert_configs.threshold),
      recipient_email = COALESCE(${emailVal},           alert_configs.recipient_email),
      recipient_phone = COALESCE(${phoneVal},           alert_configs.recipient_phone),
      locale      = COALESCE(${localeVal},              alert_configs.locale),
      updated_at  = NOW()
    RETURNING *
  `) as unknown as Array<Record<string, unknown>>;
  return rows[0] as unknown as AlertConfig;
}

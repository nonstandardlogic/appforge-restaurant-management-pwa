import { getDb } from '@/lib/db/client';

export interface KpiData {
  ca: number | null;
  tresorerie: number | null;
  margebrute: number | null;
  alerteSeuil: boolean | null;
}

export async function fetchKpisForMonth(month: number, year: number): Promise<KpiData> {
  const sql = getDb();

  const [revenueRows, cashflowRows, expenseRows, alertRows] = await Promise.all([
    sql`SELECT SUM(amount) AS total FROM financial_records
        WHERE type = 'revenue' AND period_month = ${month} AND period_year = ${year}`,
    sql`SELECT SUM(amount) AS total FROM financial_records
        WHERE type = 'cashflow' AND period_month = ${month} AND period_year = ${year}`,
    sql`SELECT SUM(amount) AS total FROM financial_records
        WHERE type = 'expense' AND period_month = ${month} AND period_year = ${year}`,
    sql`SELECT threshold FROM alerts_config
        WHERE alert_type = 'daily_ca' AND enabled = true LIMIT 1`,
  ]);

  const caRaw = revenueRows[0]?.total ?? null;
  const cashflowRaw = cashflowRows[0]?.total ?? null;
  const expenseRaw = expenseRows[0]?.total ?? null;

  if (caRaw === null && cashflowRaw === null) {
    return { ca: null, tresorerie: null, margebrute: null, alerteSeuil: null };
  }

  const ca = caRaw !== null ? Number(caRaw) : null;
  const tresorerie = cashflowRaw !== null ? Number(cashflowRaw) : null;

  let margebrute: number | null = null;
  if (ca !== null && ca > 0 && expenseRaw !== null) {
    margebrute = Number(((ca - Number(expenseRaw)) / ca * 100).toFixed(2));
  }

  const thresholdRaw = alertRows[0]?.threshold ?? null;
  const alerteSeuil = thresholdRaw !== null && ca !== null ? ca < Number(thresholdRaw) : null;

  return { ca, tresorerie, margebrute, alerteSeuil };
}

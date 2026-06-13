import { getDb } from '@/lib/db/client';

export interface DaySummary {
  date: string;
  inflows: number;
  outflows: number;
  net: number;
}

export interface WeeklyView {
  days: DaySummary[];
  weeklyInflows: number;
  weeklyOutflows: number;
  weeklyNet: number;
}

export interface MonthlyView {
  month: number;
  year: number;
  operatingTotal: number;
  tvaCA3Total: number;
  grandTotal: number;
}

export async function fetchWeeklyCashFlow(weekStart: Date): Promise<WeeklyView> {
  const sql = getDb();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const startStr = weekStart.toISOString().slice(0, 10);
  const endStr = weekEnd.toISOString().slice(0, 10);

  const rows = await sql`
    SELECT
      created_at::date AS entry_date,
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) AS inflows,
      SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END) AS outflows
    FROM financial_records
    WHERE type = 'cashflow'
      AND created_at::date BETWEEN ${startStr} AND ${endStr}
    GROUP BY entry_date
    ORDER BY entry_date ASC
  `;

  const dayMap = new Map<string, DaySummary>();
  const cursor = new Date(weekStart);
  while (cursor <= weekEnd) {
    const key = cursor.toISOString().slice(0, 10);
    dayMap.set(key, { date: key, inflows: 0, outflows: 0, net: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const row of rows) {
    const key = String(row.entry_date).slice(0, 10);
    const day = dayMap.get(key);
    if (day) {
      day.inflows = Number(row.inflows ?? 0);
      day.outflows = Number(row.outflows ?? 0);
      day.net = Number((day.inflows + day.outflows).toFixed(2));
    }
  }

  const days = Array.from(dayMap.values());
  const weeklyInflows = Number(days.reduce((s, d) => s + d.inflows, 0).toFixed(2));
  const weeklyOutflows = Number(days.reduce((s, d) => s + d.outflows, 0).toFixed(2));
  return { days, weeklyInflows, weeklyOutflows, weeklyNet: Number((weeklyInflows + weeklyOutflows).toFixed(2)) };
}

export async function fetchMonthlyCashFlow(month: number, year: number): Promise<MonthlyView> {
  const sql = getDb();

  const [opRows, tvaRows] = await Promise.all([
    sql`SELECT COALESCE(SUM(amount), 0) AS total FROM financial_records
        WHERE type = 'cashflow' AND (category IS NULL OR category != 'tva_ca3')
          AND period_month = ${month} AND period_year = ${year}`,
    sql`SELECT COALESCE(SUM(amount), 0) AS total FROM financial_records
        WHERE type = 'cashflow' AND category = 'tva_ca3'
          AND period_month = ${month} AND period_year = ${year}`,
  ]);

  const operatingTotal = Number(Number(opRows[0]?.total ?? 0).toFixed(2));
  const tvaCA3Total = Number(Number(tvaRows[0]?.total ?? 0).toFixed(2));
  return { month, year, operatingTotal, tvaCA3Total, grandTotal: Number((operatingTotal + tvaCA3Total).toFixed(2)) };
}

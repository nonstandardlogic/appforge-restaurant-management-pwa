import { getDb } from '@/lib/db/client';

export interface PlLineItem {
  category: string;
  tvaRate: number | null;
  total: number;
}

export interface MonthlyPL {
  month: number;
  year: number;
  revenues: PlLineItem[];
  charges: PlLineItem[];
  totalRevenue: number;
  totalCharges: number;
  result: number;
  tva10: number;
  tva20: number;
}

export async function fetchMonthlyPL(month: number, year: number): Promise<MonthlyPL> {
  const sql = getDb();

  const rows = (await sql`
    SELECT type, category, tva_rate, SUM(amount) AS total
    FROM financial_records
    WHERE type IN ('revenue', 'expense')
      AND period_month = ${month}
      AND period_year = ${year}
    GROUP BY type, category, tva_rate
    ORDER BY type DESC, category ASC
  `) as Array<Record<string, any>>;

  const revenues: PlLineItem[] = [];
  const charges: PlLineItem[] = [];
  let totalRevenue = 0;
  let totalCharges = 0;
  let tva10 = 0;
  let tva20 = 0;

  for (const row of rows) {
    const item: PlLineItem = {
      category: (row.category as string) || 'Non catégorisé',
      tvaRate: row.tva_rate != null ? Number(row.tva_rate) : null,
      total: Number(row.total),
    };
    if (row.type === 'revenue') {
      revenues.push(item);
      totalRevenue += item.total;
      if (item.tvaRate === 10) tva10 = Number((tva10 + item.total * 0.10).toFixed(2));
      else if (item.tvaRate === 20) tva20 = Number((tva20 + item.total * 0.20).toFixed(2));
    } else {
      charges.push(item);
      totalCharges += item.total;
    }
  }

  return {
    month, year, revenues, charges,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalCharges: Number(totalCharges.toFixed(2)),
    result: Number((totalRevenue - totalCharges).toFixed(2)),
    tva10: Number(tva10.toFixed(2)),
    tva20: Number(tva20.toFixed(2)),
  };
}

// app/api/reports/x/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

function chicagoDayBoundsUTC() {
  const chicagoDateStr = new Date().toLocaleString('en-CA', { timeZone: 'America/Chicago' }).slice(0, 10);
  const [year, month, day] = chicagoDateStr.split('-').map(Number);
  const localMidnightStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T00:00:00`;
  const dInChicago = new Date(new Date(localMidnightStr).toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const startUtc = new Date(dInChicago.getTime() - dInChicago.getTimezoneOffset() * 60000).toISOString(); // ensure ISO UTC
  const nextMidnightUtc = new Date(dInChicago.getTime() + 24 * 60 * 60 * 1000 - dInChicago.getTimezoneOffset() * 60000).toISOString();

  return { startUtc, endUtc: nextMidnightUtc };
}

export async function GET() {
  try {
    const { startUtc, endUtc } = chicagoDayBoundsUTC();

    const q = `
      SELECT
        date_trunc('hour', t.timestamp) AT TIME ZONE 'UTC' AS hour_utc,
        COUNT(DISTINCT t.id) AS orders_count,
        COALESCE(SUM(t.amount), 0)::numeric(12,2) AS gross_sales,
        COUNT(ti.*) AS items_sold
      FROM transactions t
      LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
      WHERE t.timestamp >= $1
        AND t.timestamp < $2
      GROUP BY date_trunc('hour', t.timestamp)
      ORDER BY date_trunc('hour', t.timestamp);
    `;

    const { rows } = await pool.query(q, [startUtc, endUtc]);

    const result = rows.map((r: any) => ({
      hour: (r.hour_utc instanceof Date) ? r.hour_utc.toISOString() : r.hour_utc,
      orders_count: Number(r.orders_count ?? 0),
      gross_sales: Number(r.gross_sales ?? 0),
      items_sold: Number(r.items_sold ?? 0),
    }));

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

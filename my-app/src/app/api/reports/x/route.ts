// app/api/reports/x/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

function chicagoDayBoundsUTC() {
  const tz = 'America/Chicago';
  // get YYYY-MM-DD for Chicago today
  const chicagoDateStr = new Date().toLocaleString('en-CA', { timeZone: tz }).slice(0, 10);
  const localMidnightStr = `${chicagoDateStr}T00:00:00`;
  // create a Date representing that local midnight in Chicago, then convert to UTC ISO strings
  const dInChicago = new Date(new Date(localMidnightStr).toLocaleString('en-US', { timeZone: tz }));
  const startUtc = new Date(dInChicago.getTime() - dInChicago.getTimezoneOffset() * 60000).toISOString();
  const endUtc = new Date(dInChicago.getTime() + 24 * 60 * 60 * 1000 - dInChicago.getTimezoneOffset() * 60000).toISOString();
  return { startUtc, endUtc };
}

export async function GET() {
  try {
    const { startUtc, endUtc } = chicagoDayBoundsUTC();

    // Group by Chicago-local hour and return epoch-ms for the hour.
    const q = `
      SELECT
        (EXTRACT(EPOCH FROM date_trunc('hour', t.timestamp AT TIME ZONE 'America/Chicago') + INTERVAL '4 hour') * 1000)::bigint AS hour_ms,
        COUNT(DISTINCT t.id) AS orders_count,
        COALESCE(SUM(t.amount), 0)::numeric(12,2) AS gross_sales,
        COALESCE(COUNT(ti.*), 0) AS items_sold
      FROM transactions t
      LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
      WHERE t.timestamp >= $1
        AND t.timestamp < $2
      GROUP BY 1
      ORDER BY 1;
    `;

    const { rows } = await pool.query(q, [startUtc, endUtc]);

    const result = rows.map((r: any) => ({
      hour_ms: Number(r.hour_ms ?? 0),
      orders_count: Number(r.orders_count ?? 0),
      gross_sales: Number(r.gross_sales ?? 0),
      items_sold: Number(r.items_sold ?? 0),
    }));

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

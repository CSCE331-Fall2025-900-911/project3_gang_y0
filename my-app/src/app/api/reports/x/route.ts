// app/api/reports/x/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

function chicagoDayBoundsUTC() {
  const tz = 'America/Chicago';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const get = (t: string) => {
    const p = parts.find(x => x.type === t);
    if (!p) throw new Error(`Missing part ${t}`);
    return p.value;
  };

  const y = get('year');
  const m = get('month');
  const d = get('day');

  const startLocal = new Date(`${y}-${m}-${d}T00:00:00-06:00`);
  const endLocal = new Date(startLocal.getTime() + 24 * 3600 * 1000);

  return {
    startUtc: startLocal.toISOString(),
    endUtc: endLocal.toISOString()
  };
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

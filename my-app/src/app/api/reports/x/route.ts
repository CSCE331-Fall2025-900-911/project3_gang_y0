import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  const client = await pool.connect();
  try {
    const q = `
      SELECT
        date_trunc('hour', COALESCE(t.timestamp, now())) AS hour,
        COUNT(DISTINCT t.id) AS orders_count,
        COALESCE(SUM(t.amount), 0)::numeric(12,2) AS gross_sales,
        COUNT(ti.*) AS items_sold
      FROM transactions t
      LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
      WHERE t.timestamp >= date_trunc('day', now())
        AND t.timestamp < date_trunc('day', now()) + interval '1 day'
      GROUP BY date_trunc('hour', COALESCE(t.timestamp, now()))
      ORDER BY hour;
    `;
    const { rows } = await client.query(q);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    client.release();
  }
}
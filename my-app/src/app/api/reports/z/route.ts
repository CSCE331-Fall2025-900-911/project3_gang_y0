import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST() {
  const client = await pool.connect();
  try {
    const q = `
      SELECT
        date_trunc('day', COALESCE(t.timestamp, now())) AS day,
        COUNT(DISTINCT t.id) AS total_orders,
        COALESCE(SUM(t.amount), 0)::numeric(12,2) AS gross_sales,
        COALESCE(AVG(t.amount), 0)::numeric(12,2) AS avg_order_amount,
        COUNT(ti.*) AS total_items_sold
      FROM transactions t
      LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
      WHERE t.timestamp >= date_trunc('day', now())
        AND t.timestamp < date_trunc('day', now()) + interval '1 day'
      GROUP BY date_trunc('day', COALESCE(t.timestamp, now()));
    `;
    const { rows } = await client.query(q);
    const summary = rows[0] ?? {
      day: new Date().toISOString().slice(0,10),
      total_orders: 0,
      gross_sales: '0.00',
      avg_order_amount: '0.00',
      total_items_sold: 0,
    };

    return NextResponse.json({ summary });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    client.release();
  }
}
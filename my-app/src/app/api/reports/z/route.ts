import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const summaryQuery = `
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

    const { rows } = await client.query(summaryQuery);
    const summary = rows[0] ?? {
      day: new Date().toISOString().slice(0, 10),
      total_orders: 0,
      gross_sales: '0.00',
      avg_order_amount: '0.00',
      total_items_sold: 0,
    };

    const deleteItemsQuery = `
      DELETE FROM transaction_items
      WHERE transaction_id IN (
        SELECT id FROM transactions
        WHERE timestamp >= date_trunc('day', now())
          AND timestamp < date_trunc('day', now()) + interval '1 day'
      );
    `;

    const deleteTransactionsQuery = `
      DELETE FROM transactions
      WHERE timestamp >= date_trunc('day', now())
        AND timestamp < date_trunc('day', now()) + interval '1 day';
    `;

    await client.query(deleteItemsQuery);
    await client.query(deleteTransactionsQuery);

    await client.query('COMMIT');

    return NextResponse.json({ summary });

  } catch (err) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    client.release();
  }
}

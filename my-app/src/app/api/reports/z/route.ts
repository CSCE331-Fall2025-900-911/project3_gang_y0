// app/api/reports/z/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

function chicagoDayBoundsUTC() {
  const chicagoDateStr = new Date().toLocaleString('en-CA', { timeZone: 'America/Chicago' }).slice(0, 10);
  const [year, month, day] = chicagoDateStr.split('-').map(Number);
  const localMidnightStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T00:00:00`;
  const dInChicago = new Date(new Date(localMidnightStr).toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const startUtc = new Date(dInChicago.getTime() - dInChicago.getTimezoneOffset() * 60000).toISOString();
  const nextMidnightUtc = new Date(dInChicago.getTime() + 24 * 60 * 60 * 1000 - dInChicago.getTimezoneOffset() * 60000).toISOString();
  return { startUtc, endUtc: nextMidnightUtc };
}

export async function POST() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { startUtc, endUtc } = chicagoDayBoundsUTC();

    const summaryQuery = `
      SELECT
        date_trunc('day', t.timestamp) AS day,
        COUNT(DISTINCT t.id) AS total_orders,
        COALESCE(SUM(t.amount), 0)::numeric(12,2) AS gross_sales,
        COALESCE(AVG(t.amount), 0)::numeric(12,2) AS avg_order_amount,
        COUNT(ti.*) AS total_items_sold
      FROM transactions t
      LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
      WHERE t.timestamp >= $1 AND t.timestamp < $2
      GROUP BY date_trunc('day', t.timestamp);
    `;
    const { rows } = await client.query(summaryQuery, [startUtc, endUtc]);
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
        WHERE timestamp >= $1 AND timestamp < $2
      );
    `;
    const deleteTransactionsQuery = `
      DELETE FROM transactions
      WHERE timestamp >= $1 AND timestamp < $2;
    `;

    await client.query(deleteItemsQuery, [startUtc, endUtc]);
    await client.query(deleteTransactionsQuery, [startUtc, endUtc]);

    await client.query('COMMIT');

    return NextResponse.json({ summary });
  } catch (err) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    client.release();
  }
}

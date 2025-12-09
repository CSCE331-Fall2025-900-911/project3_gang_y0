// app/api/reports/z/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

function chicagoDayBoundsUTC() {
  const tz = 'America/Chicago';
  const chicagoDateStr = new Date().toLocaleString('en-CA', { timeZone: tz }).slice(0, 10);
  const localMidnightStr = `${chicagoDateStr}T00:00:00`;
  const dInChicago = new Date(new Date(localMidnightStr).toLocaleString('en-US', { timeZone: tz }));
  const startUtc = new Date(dInChicago.getTime() - dInChicago.getTimezoneOffset() * 60000).toISOString();
  const endUtc = new Date(dInChicago.getTime() + 24 * 60 * 60 * 1000 - dInChicago.getTimezoneOffset() * 60000).toISOString();
  return { startUtc, endUtc };
}

export async function POST() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { startUtc, endUtc } = chicagoDayBoundsUTC();

    // Summary for the Chicago local date
    const summaryQuery = `
      SELECT
        (date_trunc('day', t.timestamp AT TIME ZONE 'America/Chicago') + INTERVAL '1 day')::date AS day,
        COUNT(DISTINCT t.id) AS total_orders,
        COALESCE(SUM(t.amount), 0)::numeric(12,2) AS gross_sales,
        COALESCE(AVG(t.amount), 0)::numeric(12,2) AS avg_order_amount,
        COALESCE(COUNT(ti.*), 0) AS total_items_sold
      FROM transactions t
      LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
      WHERE t.timestamp >= $1 AND t.timestamp < $2
      GROUP BY date_trunc('day', t.timestamp AT TIME ZONE 'America/Chicago');
    `;

    const { rows } = await client.query(summaryQuery, [startUtc, endUtc]);
    const summaryRow = rows[0] ?? null;
    const summary = summaryRow
      ? {
          day: summaryRow.day,
          total_orders: Number(summaryRow.total_orders ?? 0),
          gross_sales: String(summaryRow.gross_sales ?? '0.00'),
          avg_order_amount: String(summaryRow.avg_order_amount ?? '0.00'),
          total_items_sold: Number(summaryRow.total_items_sold ?? 0),
        }
      : {
          day: new Date().toLocaleString('en-CA', { timeZone: 'America/Chicago' }),
          total_orders: 0,
          gross_sales: '0.00',
          avg_order_amount: '0.00',
          total_items_sold: 0,
        };

    // Delete items & transactions and capture counts
    const deleteItemsQuery = `
      DELETE FROM transaction_items
      WHERE transaction_id IN (
        SELECT id FROM transactions
        WHERE timestamp >= $1 AND timestamp < $2
      );
    `;
    const deleteItemsResult = await client.query(deleteItemsQuery, [startUtc, endUtc]);
    const deletedItems = deleteItemsResult.rowCount ?? 0;

    const deleteTransactionsQuery = `
      DELETE FROM transactions
      WHERE timestamp >= $1 AND timestamp < $2;
    `;
    const deleteTransResult = await client.query(deleteTransactionsQuery, [startUtc, endUtc]);
    const deletedTransactions = deleteTransResult.rowCount ?? 0;

    await client.query('COMMIT');

    return NextResponse.json({
      summary,
      deleted_transactions: Number(deletedTransactions),
      deleted_items: Number(deletedItems),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    client.release();
  }
}

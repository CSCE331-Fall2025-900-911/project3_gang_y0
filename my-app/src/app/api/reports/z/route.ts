// app/api/reports/z/route.ts
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

export async function POST() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { startUtc, endUtc } = chicagoDayBoundsUTC();

    // Summary for the Chicago local date
    const summaryQuery = `
      SELECT
        (date_trunc('day', t.timestamp AT TIME ZONE 'America/Chicago') + INTERVAL '4 hour')::date AS day,
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

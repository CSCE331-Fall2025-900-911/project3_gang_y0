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
      WITH tx AS (
        SELECT
          id,
          amount,
          date_trunc('day', timestamp AT TIME ZONE 'America/Chicago') AS day_local
        FROM transactions
        WHERE timestamp >= $1 AND timestamp < $2
      ),
      ti_count AS (
        SELECT transaction_id, COUNT(*) AS items
        FROM transaction_items
        WHERE transaction_id IN (SELECT id FROM tx)
        GROUP BY transaction_id
      )
      SELECT
        (tx.day_local + INTERVAL '4 hour')::date AS day,
        COUNT(tx.id) AS total_orders,
        COALESCE(SUM(tx.amount), 0)::numeric(12,2) AS gross_sales,
        COALESCE(AVG(tx.amount), 0)::numeric(12,2) AS avg_order_amount,
        COALESCE(SUM(ti_count.items), 0) AS total_items_sold
      FROM tx
      LEFT JOIN ti_count ON ti_count.transaction_id = tx.id
      GROUP BY tx.day_local;
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

import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json(
        { error: 'from and to query params required (ISO timestamps)' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const q = `
        SELECT
          m.id AS menu_item_id,
          m.item AS menu_item,
          COUNT(ti.id) FILTER (
            WHERE (t.timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $1
              AND (t.timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $2
          ) AS qty_sold,
          (COUNT(ti.id) FILTER (
            WHERE (t.timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $1
              AND (t.timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $2
          ) * m.price)::numeric(12,2) AS total_sales
        FROM menu m
        LEFT JOIN transaction_items ti ON ti.item_id = m.id
        LEFT JOIN transactions t ON t.id = ti.transaction_id
        GROUP BY m.id, m.item, m.price
        ORDER BY total_sales DESC, m.item;
      `;

      const { rows } = await client.query(q, [from, to]);

      const result = rows.map(r => ({
        menu_item_id: r.menu_item_id,
        menu_item: r.menu_item,
        qty_sold: Number(r.qty_sold),
        total_sales: Number(r.total_sales)
      }));

      return NextResponse.json(result);
    } finally {
      client.release();
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

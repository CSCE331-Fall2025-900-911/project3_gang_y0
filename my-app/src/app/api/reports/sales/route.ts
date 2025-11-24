import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json({ error: 'from and to query params required (ISO timestamps)' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const q = `
        SELECT
          m.id AS menu_item_id,
          m.item AS menu_item,
          COUNT(ti.*) AS qty_sold,
          (COUNT(ti.*) * COALESCE(m.price, 0))::numeric(12,2) AS total_sales
        FROM transaction_items ti
        JOIN transactions t ON t.id = ti.transaction_id
        JOIN menu m ON m.id = ti.item_id
        WHERE t.timestamp >= $1 AND t.timestamp <= $2
        GROUP BY m.id, m.item, m.price
        ORDER BY total_sales DESC;
      `;
      const { rows } = await client.query(q, [from, to]);
      return NextResponse.json(rows);
    } finally {
      client.release();
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
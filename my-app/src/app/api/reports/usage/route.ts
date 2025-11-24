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
      // We treat each transaction_items row as one sold quantity. If you later add quantity field, change COUNT(ti.*) -> SUM(ti.quantity) accordingly.
      const q = `
        SELECT
          inv.id AS inventory_id,
          inv.item AS inventory_item,
          COALESCE(SUM(mi.quantity_required * sold.count_sold), 0)::numeric(12,3) AS total_used,
          inv.unit_price
        FROM inventory inv
        JOIN menuingredients mi ON mi.inventory_id = inv.id
        -- sold: number of times the menu item was sold in the window
        LEFT JOIN (
          SELECT ti.item_id AS menu_item_id, COUNT(ti.*) AS count_sold
          FROM transaction_items ti
          JOIN transactions t ON t.id = ti.transaction_id
          WHERE t.timestamp >= $1 AND t.timestamp <= $2
          GROUP BY ti.item_id
        ) AS sold ON sold.menu_item_id = mi.menu_item_id
        GROUP BY inv.id, inv.item, inv.unit_price
        ORDER BY total_used DESC;
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
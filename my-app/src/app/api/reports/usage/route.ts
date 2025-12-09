// app/api/reports/usage/route.ts
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

    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return NextResponse.json({ error: 'invalid from/to timestamps' }, { status: 400 });
    }

    const fromIso = fromDate.toISOString();
    const toIso = toDate.toISOString();

    const q = `
      WITH sold AS (
        SELECT ti.item_id AS menu_item_id, COUNT(*) AS count_sold
        FROM transaction_items ti
        JOIN transactions t ON t.id = ti.transaction_id
        WHERE t.timestamp >= $1 AND t.timestamp <= $2
        GROUP BY ti.item_id
      )
      SELECT
        inv.id AS inventory_id,
        inv.item AS inventory_item,
        COALESCE(SUM(mi.quantity_required * sold.count_sold), 0)::numeric(12,3) AS total_used,
        inv.unit_price
      FROM inventory inv
      JOIN menuingredients mi ON mi.inventory_id = inv.id
      LEFT JOIN sold ON sold.menu_item_id = mi.menu_item_id
      GROUP BY inv.id, inv.item, inv.unit_price
      ORDER BY total_used DESC;
    `;

    const { rows } = await pool.query(q, [fromIso, toIso]);

    const result = rows.map((r: any) => ({
      inventory_id: r.inventory_id,
      inventory_item: r.inventory_item,
      total_used: Number(r.total_used ?? 0),
      unit_price: Number(r.unit_price ?? 0),
    }));

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

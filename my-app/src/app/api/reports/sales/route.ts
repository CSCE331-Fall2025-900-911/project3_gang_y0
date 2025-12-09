// app/api/reports/sales/route.ts
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
        SELECT ti.item_id, COUNT(*) AS qty
        FROM transaction_items ti
        JOIN transactions t ON t.id = ti.transaction_id
        WHERE t.timestamp >= $1 AND t.timestamp <= $2
        GROUP BY ti.item_id
      )
      SELECT
        m.id AS menu_item_id,
        m.item AS menu_item,
        COALESCE(s.qty, 0) AS qty_sold,
        (COALESCE(s.qty, 0) * m.price)::numeric(12,2) AS total_sales
      FROM menu m
      LEFT JOIN sold s ON s.item_id = m.id
      ORDER BY total_sales DESC, m.item;
    `;

    const { rows } = await pool.query(q, [fromIso, toIso]);

    const result = rows.map((r: any) => ({
      menu_item_id: r.menu_item_id,
      menu_item: r.menu_item,
      qty_sold: Number(r.qty_sold ?? 0),
      total_sales: Number(r.total_sales ?? 0),
    }));

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

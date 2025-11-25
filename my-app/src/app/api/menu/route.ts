import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET() {
  try {
    const result = await pool.query('SELECT id, item, category, price FROM menu ORDER BY category, item');

    const menuIds = result.rows.map((r) => r.id);
    const invRes = await pool.query('SELECT menu_item_id, inventory_id FROM menuingredients WHERE menu_item_id = ANY($1)', [menuIds]);

    const items = result.rows.map((r) => ({
      ...r,
      price: parseFloat(r.price),
      inventory_item_ids: invRes.rows.filter((i) => i.menu_item_id === r.id).map((i) => i.inventory_id),
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { item, price, category, inventory_item_ids } = await req.json();

    const maxRes = await pool.query('SELECT MAX(id) AS max_id FROM menu');
    const nextId = (maxRes.rows[0].max_id || 0) + 1;

    const newItem = await pool.query(
      'INSERT INTO menu (id, item, category, price) VALUES ($1,$2,$3,$4) RETURNING id',
      [nextId, item, category, price]
    );

    if (inventory_item_ids && inventory_item_ids.length > 0) {
      for (const invId of inventory_item_ids) {
        const exists = await pool.query('SELECT 1 FROM inventory WHERE id=$1', [invId]);
        if (exists.rowCount === 0) continue;
        await pool.query(
          'INSERT INTO menuingredients (menu_item_id, inventory_id, quantity_required) VALUES ($1,$2,1)',
          [nextId, invId]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get('id'));
    const { item, price, category, inventory_item_ids } = await req.json();

    await pool.query('UPDATE menu SET item=$1, price=$2, category=$3 WHERE id=$4', [item, price, category, id]);

    await pool.query('DELETE FROM menuingredients WHERE menu_item_id=$1', [id]);

    if (inventory_item_ids && inventory_item_ids.length > 0) {
      for (const invId of inventory_item_ids) {
        const exists = await pool.query('SELECT 1 FROM inventory WHERE id=$1', [invId]);
        if (exists.rowCount === 0) continue;
        await pool.query(
          'INSERT INTO menuingredients (menu_item_id, inventory_id, quantity_required) VALUES ($1,$2,1)',
          [id, invId]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get('id'));

    await pool.query('DELETE FROM menuingredients WHERE menu_item_id=$1', [id]);
    await pool.query('DELETE FROM menu WHERE id=$1', [id]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 });
  }
}

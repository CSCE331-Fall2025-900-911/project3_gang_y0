import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT id, item, quantity, vendor, unit_price
      FROM inventory
      ORDER BY item
    `);
    const items = result.rows.map(row => ({
      id: row.id,
      item: row.item,
      quantity: Number(row.quantity),
      vendor: row.vendor,
      unit_price: Number(row.unit_price)
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error('Error fetching inventory items:', err);
    return NextResponse.json({ error: 'Failed to fetch inventory items' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Get all inventory items
export async function GET() {
  const result = await pool.query('SELECT * FROM inventory ORDER BY id');
  const items = result.rows.map((i) => ({
    ...i,
    unit_price: i.unit_price !== null ? parseFloat(i.unit_price) : 0,
  }));
  return NextResponse.json(items);
}

// Create a new inventory item
export async function POST(req: Request) {
  const { name, quantity, unit, vendor, unit_price } = await req.json();
  const result = await pool.query(
    'INSERT INTO inventory (item, quantity, unit, vendor, unit_price) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [name, quantity, unit, vendor, unit_price]
  );
  return NextResponse.json(result.rows[0]);
}

// Update an existing inventory item
export async function PUT(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const { name, quantity, unit, vendor, unit_price } = await req.json();
  const result = await pool.query(
    'UPDATE inventory SET item=$1, quantity=$2, unit=$3, vendor=$4, unit_price=$5 WHERE id=$6 RETURNING *',
    [name, quantity, unit, vendor, unit_price, id]
  );
  return NextResponse.json(result.rows[0]);
}

// Delete an inventory item
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  await pool.query('DELETE FROM inventory WHERE id=$1', [id]);
  return NextResponse.json({ success: true });
}

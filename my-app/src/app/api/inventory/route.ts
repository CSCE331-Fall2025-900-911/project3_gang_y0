import { pool } from '@/lib/db';

export async function GET() {
  const res = await pool.query('SELECT * FROM inventory ORDER BY id');
  const rows = res.rows.map(row => ({ ...row, unit_price: Number(row.unit_price) }));
  return new Response(JSON.stringify(rows));
}


export async function POST(req: Request) {
  const { item, quantity, vendor, unit_price } = await req.json();
  const res = await pool.query(
    'INSERT INTO inventory (item, quantity, vendor, unit_price) VALUES ($1,$2,$3,$4) RETURNING *',
    [item, quantity, vendor, unit_price]
  );
  return new Response(JSON.stringify(res.rows[0]));
}

export async function PUT(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const { item, quantity, vendor, unit_price } = await req.json();
  const res = await pool.query(
    'UPDATE inventory SET item=$1, quantity=$2, vendor=$3, unit_price=$4 WHERE id=$5 RETURNING *',
    [item, quantity, vendor, unit_price, id]
  );
  return new Response(JSON.stringify(res.rows[0]));
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  await pool.query('DELETE FROM inventory WHERE id=$1', [id]);
  return new Response(JSON.stringify({ success: true }));
}

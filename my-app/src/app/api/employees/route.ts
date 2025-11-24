import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  const res = await pool.query('SELECT * FROM employees ORDER BY id');
  return NextResponse.json(res.rows);
}

export async function POST(req: NextRequest) {
  const { name, email, position } = await req.json();

  const idRes = await pool.query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM employees');
  const nextId = idRes.rows[0].next_id;

  const res = await pool.query(
    'INSERT INTO employees (id, name, email, position) VALUES ($1,$2,$3,$4) RETURNING *',
    [nextId, name, email, position]
  );

  return NextResponse.json(res.rows[0]);
}


export async function PUT(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const { name, email, position } = await req.json();
  const res = await pool.query(
    'UPDATE employees SET name=$1, email=$2, position=$3 WHERE id=$4 RETURNING *',
    [name, email, position, id]
  );
  return NextResponse.json(res.rows[0]);
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  await pool.query('DELETE FROM employees WHERE id=$1', [id]);
  return NextResponse.json({ success: true });
}

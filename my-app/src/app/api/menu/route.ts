import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT id, item as name, category, price FROM menu ORDER BY category, item'
    );

    // Convert price to number (PostgreSQL returns numeric as string)
    const items = result.rows.map(row => ({
      ...row,
      price: parseFloat(row.price)
    }));

    return NextResponse.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}


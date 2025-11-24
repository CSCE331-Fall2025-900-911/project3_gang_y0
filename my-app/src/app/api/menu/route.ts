import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT id, item, category, price 
      FROM menu 
      ORDER BY category, item
    `);

    // Group items by category and ensure price is a number
    const groupedMenu = result.rows.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push({
        ...item,
        price: parseFloat(item.price) // Convert price to number
      });
      return acc;
    }, {});

    return NextResponse.json(groupedMenu);
  } catch (error) {
    console.error('Menu fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('customer-session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const customer = JSON.parse(sessionCookie.value);
    
    // Fetch latest customer data from database to ensure we have current points
    const result = await pool.query(
      'SELECT id, name, rewardspoints FROM customers WHERE id = $1',
      [customer.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const dbCustomer = result.rows[0];
    
    return NextResponse.json({
      success: true,
      customer: {
        id: dbCustomer.id,
        name: dbCustomer.name,
        rewardspoints: dbCustomer.rewardspoints || 0
      }
    });
  } catch (error) {
    console.error('Customer check error:', error);
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}

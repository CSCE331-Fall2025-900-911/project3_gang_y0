import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Get customer from session cookie
function getCustomerFromSession(request: NextRequest): { id: number; rewardspoints: number } | null {
  try {
    const sessionCookie = request.cookies.get('customer-session');
    if (!sessionCookie) return null;
    
    const customer = JSON.parse(sessionCookie.value);
    return {
      id: customer.id,
      rewardspoints: customer.rewardspoints || 0
    };
  } catch (error) {
    return null;
  }
}

// GET: Fetch customer rewards points
export async function GET(request: NextRequest) {
  try {
    const customer = getCustomerFromSession(request);
    
    if (!customer) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch latest points from database
    const result = await pool.query(
      'SELECT rewardspoints FROM customers WHERE id = $1',
      [customer.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const rewardspoints = result.rows[0].rewardspoints || 0;

    return NextResponse.json({
      success: true,
      rewardspoints
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST: Redeem rewards points for discount
export async function POST(request: NextRequest) {
  try {
    const { pointsToRedeem } = await request.json();

    if (!pointsToRedeem || typeof pointsToRedeem !== 'number' || pointsToRedeem <= 0) {
      return NextResponse.json({ error: 'Invalid points to redeem' }, { status: 400 });
    }

    const customer = getCustomerFromSession(request);
    
    if (!customer) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch current points from database
    const result = await pool.query(
      'SELECT rewardspoints FROM customers WHERE id = $1',
      [customer.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const currentPoints = result.rows[0].rewardspoints || 0;

    if (currentPoints < pointsToRedeem) {
      return NextResponse.json({ 
        error: 'Insufficient points',
        currentPoints,
        requestedPoints: pointsToRedeem
      }, { status: 400 });
    }

    // Calculate discount: 10 points = $1
    const discountAmount = pointsToRedeem / 10;

    // Update points in database
    const newPoints = currentPoints - pointsToRedeem;
    await pool.query(
      'UPDATE customers SET rewardspoints = $1 WHERE id = $2',
      [newPoints, customer.id]
    );

    return NextResponse.json({
      success: true,
      pointsRedeemed: pointsToRedeem,
      discountAmount: discountAmount.toFixed(2),
      remainingPoints: newPoints
    });
  } catch (error) {
    console.error('Error redeeming rewards:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT: Add points to customer (called after checkout)
export async function PUT(request: NextRequest) {
  try {
    const { pointsToAdd, customerId } = await request.json();

    if (!pointsToAdd || typeof pointsToAdd !== 'number' || pointsToAdd <= 0) {
      return NextResponse.json({ error: 'Invalid points to add' }, { status: 400 });
    }

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    // Get current points
    const result = await pool.query(
      'SELECT rewardspoints FROM customers WHERE id = $1',
      [customerId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const currentPoints = result.rows[0].rewardspoints || 0;
    const newPoints = currentPoints + pointsToAdd;

    // Update points in database
    await pool.query(
      'UPDATE customers SET rewardspoints = $1 WHERE id = $2',
      [newPoints, customerId]
    );

    return NextResponse.json({
      success: true,
      pointsAdded: pointsToAdd,
      newTotalPoints: newPoints
    });
  } catch (error) {
    console.error('Error adding rewards:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


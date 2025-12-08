import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Normalize phone number by removing all non-digit characters
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

// GET: Look up customer by phone number and return rewards info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Normalize the input phone number
    const normalizedInput = normalizePhoneNumber(phoneNumber);

    // Query all customers and check if any normalized phone number matches
    const result = await pool.query(
      'SELECT id, name, phonenumber, rewardspoints, birthday, email FROM customers WHERE phonenumber IS NOT NULL AND phonenumber != \'\''
    );

    // Find matching customer by comparing normalized phone numbers
    const customer = result.rows.find(row => {
      if (!row.phonenumber) return false;
      const normalizedDb = normalizePhoneNumber(row.phonenumber);
      return normalizedDb === normalizedInput;
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phonenumber: customer.phonenumber,
        rewardspoints: customer.rewardspoints || 0,
        birthday: customer.birthday,
        email: customer.email
      }
    });
  } catch (error) {
    console.error('Error looking up customer:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST: Redeem points for a customer (by customer ID)
export async function POST(request: NextRequest) {
  try {
    const { customerId, pointsToRedeem } = await request.json();

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    if (!pointsToRedeem || typeof pointsToRedeem !== 'number' || pointsToRedeem <= 0) {
      return NextResponse.json({ error: 'Invalid points to redeem' }, { status: 400 });
    }

    // Fetch current points from database
    const result = await pool.query(
      'SELECT rewardspoints FROM customers WHERE id = $1',
      [customerId]
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
      [newPoints, customerId]
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


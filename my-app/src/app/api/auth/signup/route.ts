import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Normalize phone number by removing all non-digit characters
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const { name, phoneNumber, email } = await request.json();

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!phoneNumber || !phoneNumber.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // Check if customer with this phone number already exists
    const existingResult = await pool.query(
      'SELECT id FROM customers WHERE phonenumber IS NOT NULL AND phonenumber != \'\''
    );

    const existingCustomer = existingResult.rows.find(row => {
      if (!row.phonenumber) return false;
      const normalizedDb = normalizePhoneNumber(row.phonenumber);
      return normalizedDb === normalizedPhone;
    });

    if (existingCustomer) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
    }

    // Check if email already exists
    const emailCheck = await pool.query(
      'SELECT id FROM customers WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (emailCheck.rows.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Get the next available ID
    const maxIdResult = await pool.query('SELECT COALESCE(MAX(id), 0) as max_id FROM customers');
    const nextId = (maxIdResult.rows[0].max_id || 0) + 1;

    // Insert new customer with explicit ID
    const result = await pool.query(
      `INSERT INTO customers (id, name, phonenumber, email, rewardspoints) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, phonenumber, email, rewardspoints`,
      [nextId, name.trim(), normalizedPhone, email.trim().toLowerCase(), 0]
    );

    const newCustomer = result.rows[0];

    // Create session token
    const response = NextResponse.json({
      success: true,
      customer: {
        id: newCustomer.id,
        name: newCustomer.name,
        phonenumber: newCustomer.phonenumber,
        email: newCustomer.email,
        rewardspoints: newCustomer.rewardspoints || 0
      }
    });

    // Set httpOnly cookie for session
    response.cookies.set('customer-session', JSON.stringify({
      id: newCustomer.id,
      name: newCustomer.name,
      phonenumber: newCustomer.phonenumber,
      email: newCustomer.email,
      rewardspoints: newCustomer.rewardspoints || 0
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Sign up error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


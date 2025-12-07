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
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Normalize the input phone number
    const normalizedInput = normalizePhoneNumber(phoneNumber);

    // Query all customers and check if any normalized phone number matches
    const result = await pool.query(
      'SELECT id, name, phonenumber, rewardspoints, birthday, email, google_user_id FROM customers WHERE phonenumber IS NOT NULL AND phonenumber != \'\''
    );

    // Find matching customer by comparing normalized phone numbers
    const customer = result.rows.find(row => {
      if (!row.phonenumber) return false;
      const normalizedDb = normalizePhoneNumber(row.phonenumber);
      return normalizedDb === normalizedInput;
    });

    if (!customer) {
      return NextResponse.json({ error: 'Phone number not found' }, { status: 401 });
    }

    // Create session token
    const response = NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phonenumber: customer.phonenumber,
        rewardspoints: customer.rewardspoints || 0,
        birthday: customer.birthday,
        email: customer.email,
        google_user_id: customer.google_user_id
      }
    });

    // Set httpOnly cookie for session
    response.cookies.set('customer-session', JSON.stringify({
      id: customer.id,
      name: customer.name,
      phonenumber: customer.phonenumber,
      rewardspoints: customer.rewardspoints || 0,
      birthday: customer.birthday,
      email: customer.email,
      google_user_id: customer.google_user_id
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Customer login error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


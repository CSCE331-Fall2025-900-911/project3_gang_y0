import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ isEmployee: false, employee: null });
    }

    console.log('Session user:', session.user);
    console.log('Checking for employee with email:', session.user.email);

    // First check by email (most reliable)
    const emailResult = await pool.query(
      'SELECT id, name, email, position, google_user_id FROM employees WHERE email = $1',
      [session.user.email]
    );

    if (emailResult.rows.length > 0) {
      const employee = emailResult.rows[0];
      console.log('Found employee:', employee);
      
      return NextResponse.json({
        isEmployee: true,
        employee: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          position: employee.position
        }
      });
    }

    console.log('No employee found with email:', session.user.email);
    return NextResponse.json({ isEmployee: false, employee: null });
  } catch (error) {
    console.error('Error checking employee status:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

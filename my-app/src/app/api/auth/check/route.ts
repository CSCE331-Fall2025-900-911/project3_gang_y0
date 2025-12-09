import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function GET(request: NextRequest) {
  try {
    // First check for cookie-based session (email/password login)
    const sessionCookie = request.cookies.get('employee-session');
    
    if (sessionCookie) {
      const employee = JSON.parse(sessionCookie.value);
      return NextResponse.json({
        success: true,
        employee
      });
    }

    // Check for OAuth session (Google login)
    const session = await getServerSession(authOptions);
    
    if (session?.user?.email) {
      // Query database to check if user is an employee
      const result = await pool.query(
        'SELECT id, name, email, position FROM employees WHERE email = $1',
        [session.user.email]
      );

      if (result.rows.length > 0) {
        const employee = result.rows[0];
        return NextResponse.json({
          success: true,
          employee: {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            position: employee.position
          }
        });
      }
    }
    
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
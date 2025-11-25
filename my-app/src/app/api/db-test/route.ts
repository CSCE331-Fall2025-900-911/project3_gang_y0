import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 10000, // 10 second timeout
    });

    const client = await pool.connect();
    const result = await client.query('SELECT NOW(), version()');
    client.release();

    return NextResponse.json({ 
      success: true, 
      timestamp: result.rows[0].now,
      version: result.rows[0].version,
      message: 'Database connection successful' 
    });
  } catch (error) {
    console.error('Database connection error:', error);
    const err = error as any;
    return NextResponse.json({ 
      success: false,
      error: err.message || 'Unknown error',
      code: err.code || 'UNKNOWN',
      details: {
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        database: process.env.PG_DATABASE,
        user: process.env.PG_USER
      }
    }, { status: 500 });
  }
}
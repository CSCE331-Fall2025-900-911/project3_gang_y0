import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function POST(req: NextRequest) {
  const client = await pool.connect();
  
  try {
    const body = await req.json();
    const { cart, total, customerId, employeeId } = body;

    // Start a transaction
    await client.query('BEGIN');

    // Get the next transaction ID
    const transactionIdResult = await client.query(
      'SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM transactions'
    );
    const transactionId = transactionIdResult.rows[0].next_id;

    // Insert the transaction
    await client.query(
      `INSERT INTO transactions (id, amount, customer_id, timestamp, employee_id) 
       VALUES ($1, $2, $3, NOW(), $4)`,
      [transactionId, total, customerId || null, employeeId || null]
    );

    // Get the starting transaction_items ID
    const itemIdResult = await client.query(
      'SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM transaction_items'
    );
    let currentItemId = itemIdResult.rows[0].next_id;

    // Insert transaction items
    for (const cartItem of cart) {
      // Insert the base drink for each quantity
      for (let i = 0; i < cartItem.quantity; i++) {
        await client.query(
          `INSERT INTO transaction_items (id, transaction_id, item_id) 
           VALUES ($1, $2, $3)`,
          [currentItemId, transactionId, cartItem.menuItem.id]
        );
        currentItemId++;
      }

      // Insert toppings for each quantity
      for (const topping of cartItem.toppings) {
        for (let i = 0; i < cartItem.quantity; i++) {
          await client.query(
            `INSERT INTO transaction_items (id, transaction_id, item_id) 
             VALUES ($1, $2, $3)`,
            [currentItemId, transactionId, topping.id]
          );
          currentItemId++;
        }
      }
    }

    // Commit the transaction
    await client.query('COMMIT');

    return NextResponse.json({ 
      success: true, 
      transactionId,
      message: 'Order placed successfully' 
    });

  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process order' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

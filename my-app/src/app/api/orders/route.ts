import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    const { items, total, paymentMethod } = await request.json();

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid order data: items required' }, { status: 400 });
    }
    if (typeof total !== 'number') {
      return NextResponse.json({ error: 'Invalid order data: total required' }, { status: 400 });
    }

    console.log('Processing order:', { itemCount: items.length, total, paymentMethod });

    await client.query('BEGIN');

    // --- Generate unique transaction ID ---
    const transactionIdRes = await client.query(
      'SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM transactions'
    );
    const transactionId = transactionIdRes.rows[0].next_id;
    console.log('Generated transaction ID:', transactionId);

    // --- Insert transaction ---
    // Note: customer_id and employee_id will be NULL for now
    // You may want to add these fields later when you implement user authentication
    await client.query(
      `INSERT INTO transactions (id, amount, timestamp, customer_id, employee_id)
       VALUES ($1, $2, NOW(), NULL, NULL)`,
      [transactionId, total]
    );
    console.log('Transaction inserted');

    // --- Generate starting ID for transaction_items ---
    const itemIdRes = await client.query(
      'SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM transaction_items'
    );
    let nextItemId = itemIdRes.rows[0].next_id;

    // --- Insert each item (respecting quantity) ---
    let totalItemsInserted = 0;
    for (const item of items) {
      if (!item.id) {
        throw new Error('Item id missing in order');
      }
      if (!item.quantity || item.quantity < 1) {
        throw new Error(`Invalid quantity for item ${item.id}`);
      }

      // Insert one row for EACH quantity
      for (let i = 0; i < item.quantity; i++) {
        await client.query(
          `INSERT INTO transaction_items (id, transaction_id, item_id)
           VALUES ($1, $2, $3)`,
          [nextItemId, transactionId, item.id]
        );
        nextItemId++;
        totalItemsInserted++;
      }
    }
    
    console.log(`Inserted ${totalItemsInserted} transaction items`);

    await client.query('COMMIT');
    console.log('Transaction committed successfully');

    return NextResponse.json({
      success: true,
      orderId: transactionId,
      itemsProcessed: totalItemsInserted,
      message: 'Order submitted successfully'
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to submit order:', err);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to submit order',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });

  } finally {
    client.release();
  }
}
import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({
	host: process.env.PG_HOST,
	user: process.env.PG_USER,
	password: process.env.PG_PASSWORD,
	database: process.env.PG_DATABASE,
	port: Number(process.env.PG_PORT),
})

export async function GET() {
	const client = await pool.connect()
	try {
		const res = await client.query(
			"SELECT id, employee_id, timestamp, status FROM check_ins ORDER BY timestamp DESC"
		)
		return NextResponse.json(res.rows)
	} finally {
		client.release()
	}
}

export async function POST(req: NextRequest) {
	const body = await req.json()
	const client = await pool.connect()
	try {
		const res = await client.query(
			"INSERT INTO check_ins (employee_id, timestamp, status) VALUES ($1, $2, $3) RETURNING id, employee_id, timestamp, status",
			[body.employee_id, body.timestamp, body.status]
		)
		return NextResponse.json(res.rows[0])
	} finally {
		client.release()
	}
}

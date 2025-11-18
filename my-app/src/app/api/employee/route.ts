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
		const res = await client.query("SELECT id, name, role FROM employees")
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
			"INSERT INTO employees (name, role) VALUES ($1, $2) RETURNING id, name, role",
			[body.name, body.role]
		)
		return NextResponse.json(res.rows[0])
	} finally {
		client.release()
	}
}

export async function PATCH(req: NextRequest) {
	const body = await req.json()
	const client = await pool.connect()
	try {
		const res = await client.query(
			"UPDATE employees SET name = $1, role = $2 WHERE id = $3 RETURNING id, name, role",
			[body.name, body.role, body.id]
		)
		return NextResponse.json(res.rows[0])
	} finally {
		client.release()
	}
}

export async function DELETE(req: NextRequest) {
	const { searchParams } = new URL(req.url)
	const id = searchParams.get("id")
	const client = await pool.connect()
	try {
		await client.query("DELETE FROM employees WHERE id = $1", [id])
		return NextResponse.json({ success: true })
	} finally {
		client.release()
	}
}

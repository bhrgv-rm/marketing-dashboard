import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema/schema";
import { inArray } from "drizzle-orm";

export async function POST(req: Request) {
	try {
		const sessionToken = req.headers.get("sessionToken");
		if (!sessionToken) {
			return NextResponse.json({ error: "Missing sessionToken" }, { status: 401 });
		}

		const body = await req.json();
		const ids = body.ids;

		if (!Array.isArray(ids) || ids.length === 0) {
			return NextResponse.json({ error: "Missing IDs" }, { status: 400 });
		}

		const users = await db
			.select({
				id: user.id,
				name: user.name,
				image: user.image,
			})
			.from(user)
			.where(inArray(user.id, ids));

		return NextResponse.json(users);
	} catch (err) {
		console.error(err);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

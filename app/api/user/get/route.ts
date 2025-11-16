import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema/schema";
import { getUserFromSessionToken, checkSuperAdmin } from "@/lib/utils-server";

export async function GET(req: Request) {
	try {
		const sessionToken = req.headers.get("sessionToken");
		if (!sessionToken) {
			return NextResponse.json({ error: "Missing sessionToken" }, { status: 401 });
		}

		if (!(await getUserFromSessionToken(sessionToken)) || !checkSuperAdmin(sessionToken)) {
			return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
		}

		const allUsers = await db.select().from(user);

		return NextResponse.json(allUsers);
	} catch (error) {
		console.error("GET /api/workspaces error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

import { db } from "@/db";
import { user } from "@/db/schema/schema";
import { checkSuperAdmin, getUserFromSessionToken } from "@/lib/utils-server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
	try {
		const sessionToken = req.headers.get("sessionToken");
		if (!sessionToken) {
			return NextResponse.json({ error: "Missing sessionToken" }, { status: 401 });
		}

		if (!checkSuperAdmin(sessionToken)) {
			return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
		}

		const suser = await getUserFromSessionToken(sessionToken);
		if (!suser) {
			return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
		}
		const users = await db.select().from(user).where(eq(user.id, suser?.id));

		return NextResponse.json(users[0].role === "SUPER ADMIN" ? { value: true } : { value: false });
	} catch (error) {
		console.error("GET /api/workspaces error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

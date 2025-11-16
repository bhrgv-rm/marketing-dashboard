import { NextResponse } from "next/server";
import { db } from "@/db";
import { roles, session, user, workspaces, workspaceUsers } from "@/db/schema/schema";
import { inArray, eq } from "drizzle-orm";
import { checkAccessFromToken, getUserFromSessionToken, checkSuperAdmin } from "@/lib/utils-server";

export async function GET(req: Request) {
	try {
		const sessionToken = req.headers.get("sessionToken");
		if (!sessionToken) {
			return NextResponse.json({ error: "Missing sessionToken" }, { status: 401 });
		}

		if (!(await getUserFromSessionToken(sessionToken)) || !checkSuperAdmin(sessionToken)) {
			return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
		}

		const { searchParams } = new URL(req.url);
		const workspaceId = searchParams.get("workspaceId");

		if (!workspaceId) {
			return NextResponse.json({ error: "Missing workspaceId" });
		}

		const wsIdNum = parseInt(workspaceId, 10);
		const allUsers = await db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				role: workspaceUsers.role,
			})
			.from(user)
			.innerJoin(workspaces, eq(workspaces.id, wsIdNum))
			.innerJoin(workspaceUsers, eq(user.id, workspaceUsers.userId));

		return NextResponse.json(allUsers);
	} catch (error) {
		console.error("GET /api/workspaces error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

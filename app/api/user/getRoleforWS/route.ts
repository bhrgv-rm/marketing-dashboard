import { NextResponse } from "next/server";
import { db } from "@/db";
import { roles, session, user, workspaces, workspaceUsers } from "@/db/schema/schema";
import { inArray, eq, and } from "drizzle-orm";
import { checkAccessFromToken, getUserFromSessionToken, checkSuperAdmin } from "@/lib/utils-server";
export async function GET(req: Request) {
	try {
		const sessionToken = req.headers.get("sessionToken");
		if (!sessionToken) {
			return NextResponse.json({ error: "Missing sessionToken" }, { status: 401 });
		}

		if (!checkSuperAdmin(sessionToken)) {
			return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
		}

		const sessionUser = await getUserFromSessionToken(sessionToken);
		if (!sessionUser) {
			return NextResponse.json({ error: "Session does not exist." }, { status: 401 });
		}
		const { searchParams } = new URL(req.url);
		const workspaceId = searchParams.get("workspaceId");

		if (!workspaceId) {
			return NextResponse.json({ error: "Missing workspaceId" });
		}

		const wsIdNum = parseInt(workspaceId, 10);

		const allUsers = await db
			.select({
				role: workspaceUsers.role,
			})
			.from(workspaceUsers)
			.innerJoin(user, eq(workspaceUsers.userId, user.id))
			.innerJoin(workspaces, eq(workspaceUsers.workspaceId, workspaces.id))
			.where(and(eq(workspaces.id, wsIdNum), eq(user.id, sessionUser.id)));

		return NextResponse.json(allUsers);
	} catch (error) {
		console.error("GET /api/workspaces error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

import { NextResponse } from "next/server";
import { db } from "@/db";
import { user, workspaceUsers } from "@/db/schema/schema";
import { inArray, eq, and } from "drizzle-orm";
import { getUserFromSessionToken } from "@/lib/utils-server";

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const workspaceId = searchParams.get("workspaceId");
		if (!workspaceId) {
			return NextResponse.json({ error: "Missing Workspace ID" }, { status: 401 });
		}
		const workspaceIdNum = parseInt(workspaceId, 10);

		const sessionToken = req.headers.get("sessionToken");
		if (!sessionToken) {
			return NextResponse.json({ error: "Missing sessionToken" }, { status: 401 });
		}

		const sessionUser = await getUserFromSessionToken(sessionToken);
		if (!sessionUser) {
			return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
		}

		const users = await db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				role: workspaceUsers.role,
				image: user.image,
			})
			.from(user)
			.innerJoin(workspaceUsers, eq(workspaceUsers.userId, user.id))
			.where(eq(workspaceUsers.workspaceId, workspaceIdNum));
		return NextResponse.json(users);
	} catch (error) {
		console.error("GET /api/workspaces error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

import { NextResponse } from "next/server";
import { db } from "@/db";
import { workspaces, workspaceUsers } from "@/db/schema/schema";
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

		const user = await getUserFromSessionToken(sessionToken);
		if (!user) {
			return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
		}

		// Fetch workspace memberships (user is part of workspaceUsers)
		const workspaceUserEntries = await db
			.select({ workspaceId: workspaceUsers.workspaceId })
			.from(workspaceUsers)
			.innerJoin(workspaces, eq(workspaceUsers.workspaceId, workspaces.id))
			.where(and(eq(workspaceUsers.userId, user.id), eq(workspaces.id, workspaceIdNum)));

		const accessibleWorkspaceIds = workspaceUserEntries.map((w) => w.workspaceId);

		if (accessibleWorkspaceIds.length === 0) {
			return NextResponse.json({ workspaces: [] }, { status: 200 });
		}

		// Fetch workspace details
		const accessibleWorkspaces = await db
			.select()
			.from(workspaces)
			.where(inArray(workspaces.id, accessibleWorkspaceIds));

		return NextResponse.json(accessibleWorkspaces, { status: 200 });
	} catch (error) {
		console.error("GET /api/workspaces error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

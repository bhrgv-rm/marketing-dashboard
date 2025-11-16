import { NextResponse } from "next/server";
import { db } from "@/db";
import { workspaces, workspaceUsers } from "@/db/schema/schema";
import { inArray, eq } from "drizzle-orm";
import { getUserFromSessionToken } from "@/lib/utils-server";

export async function GET(req: Request) {
	try {
		const sessionToken = req.headers.get("sessionToken");
		if (!sessionToken) {
			return NextResponse.json({ error: "Missing sessionToken" }, { status: 401 });
		}

		// Validate session + fetch user info
		const user = await getUserFromSessionToken(sessionToken);
		if (!user) {
			return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
		}

		// Fetch workspace memberships (user is part of workspaceUsers)
		const workspaceUserEntries = await db
			.select({ workspaceId: workspaceUsers.workspaceId })
			.from(workspaceUsers)
			.where(eq(workspaceUsers.userId, user.id));

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

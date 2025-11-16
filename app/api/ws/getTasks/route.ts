import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, workspaces, workspaceUsers } from "@/db/schema/schema";
import { eq, and } from "drizzle-orm";
import { getUserFromSessionToken } from "@/lib/utils-server";

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const workspaceId = searchParams.get("workspaceId");
		const sessionToken = req.headers.get("sessionToken");

		if (!sessionToken) {
			return NextResponse.json({ error: "Missing sessionToken" }, { status: 401 });
		}

		const user = await getUserFromSessionToken(sessionToken);
		if (!user) {
			return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
		}

		if (!workspaceId) {
			return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
		}

		const workspaceIdNum = parseInt(workspaceId, 10);

		// Check membership
		const membership = await db
			.select()
			.from(workspaceUsers)
			.where(
				and(eq(workspaceUsers.userId, user.id), eq(workspaceUsers.workspaceId, workspaceIdNum))
			)
			.limit(1);

		if (membership.length === 0) {
			return NextResponse.json({ error: "Access denied to this workspace" }, { status: 403 });
		}

		// Fetch workspace
		const workspace = await db
			.select()
			.from(workspaces)
			.where(eq(workspaces.id, workspaceIdNum))
			.limit(1);

		if (workspace.length === 0) {
			return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
		}

		// Fetch tasks
		const tasksInWorkspace = await db
			.select()
			.from(tasks)
			.where(eq(tasks.workspaceId, workspaceIdNum));

		return NextResponse.json(
			{
				workspace: workspace[0],
				tasks: tasksInWorkspace,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("GET /api/tasks error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

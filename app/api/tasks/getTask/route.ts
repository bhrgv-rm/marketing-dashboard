import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, workspaceUsers } from "@/db/schema/schema";
import { getUserFromSessionToken, checkSuperAdmin } from "@/lib/utils-server";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
	try {
		const sessionToken = req.headers.get("sessionToken");
		if (!sessionToken) {
			return NextResponse.json({ error: "Missing sessionToken" }, { status: 401 });
		}

		const user = await getUserFromSessionToken(sessionToken);
		if (!user) {
			return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
		}

		const { searchParams } = new URL(req.url);
		const taskId = searchParams.get("id");
		if (!taskId) {
			return NextResponse.json({ error: "Missing task ID" }, { status: 400 });
		}

		const sa = await checkSuperAdmin(sessionToken);

		const taskIdNum = parseInt(taskId, 10);
		if (sa) {
			const task = await db.select().from(tasks).where(eq(tasks.id, taskIdNum));
			return NextResponse.json(task[0]);
		}

		const task = await db
			.select({ task: tasks })
			.from(tasks)
			.innerJoin(workspaceUsers, eq(tasks.workspaceId, workspaceUsers.workspaceId))
			.where(and(eq(tasks.id, taskIdNum), eq(workspaceUsers.userId, user.id)))
			.limit(1);

		if (!task.length) {
			return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 });
		}

		return NextResponse.json(task[0].task, { status: 200 });
	} catch (error) {
		console.error("GET /api/tasks error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

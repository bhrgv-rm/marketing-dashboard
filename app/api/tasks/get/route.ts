import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, tasksAssignees, workspaces } from "@/db/schema/schema";
import { inArray, eq } from "drizzle-orm";
import { getUserFromSessionToken } from "@/lib/utils-server";

export async function GET(req: Request) {
	try {
		// Get session token from headers
		const sessionToken = req.headers.get("sessionToken");
		if (!sessionToken) {
			return NextResponse.json({ error: "Missing sessionToken" }, { status: 401 });
		}

		// Validate session + fetch user
		const user = await getUserFromSessionToken(sessionToken);
		if (!user) {
			return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
		}

		// Fetch all tasks assigned to the user, including workspace info
		const allTasks = await db
			.select({
				id: tasks.id,
				name: tasks.name,
				priority: tasks.priority,
				category: tasks.category,
				files: tasks.files,
				publishDate: tasks.publishDate,
				deadlineDate: tasks.deadlineDate,
				captions: tasks.captions,
				socialLinks: tasks.socialLinks,
				clientComment: tasks.clientComment,
				taskStatus: tasks.taskstatus,
				clientStatus: tasks.clientStatus,
				workspaceId: tasks.workspaceId,
				workspaceName: workspaces.name,
				workspaceImage: workspaces.image,
				createdAt: tasks.createdAt,
				createdBy: tasks.createdBy,
				updatedAt: tasks.updatedAt,
				updatedBy: tasks.updatedBy,
			})
			.from(tasks)
			.innerJoin(tasksAssignees, eq(tasks.id, tasksAssignees.taskId))
			.innerJoin(workspaces, eq(tasks.workspaceId, workspaces.id))
			.where(inArray(tasksAssignees.userId, [user.id]));

		return NextResponse.json(allTasks, { status: 200 });
	} catch (error) {
		console.error("GET /api/tasks error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

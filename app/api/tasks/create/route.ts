// /app/api/tasks/create/route.ts
import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { tasks, tasksAssignees } from "@/db/schema/schema";
import { getUserFromSessionToken } from "@/lib/utils-server";

export async function POST(req: NextRequest) {
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

		// Parse request body
		const body = await req.json();
		const {
			name,
			workspaceId,
			priority,
			category,
			publishDate,
			deadlineDate,
			assignedUsers = [], // optional array of user ids
			uploadedFiles = [], // optional array of media rows (objects from /api/fileupload)
		} = body;

		if (!name || !workspaceId || !category) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		// 1️⃣ Create new task
		const [newTask] = await db
			.insert(tasks)
			.values({
				name,
				workspaceId: Number(workspaceId),
				priority: priority || "MEDIUM",
				category,
				publishDate: publishDate ? new Date(publishDate) : null,
				deadlineDate: deadlineDate ? new Date(deadlineDate) : null,
				files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
				createdBy: user.id,
				updatedBy: user.id,
			})
			.returning();

		// 2️⃣ Add creator to tasksAssignees
		await db.insert(tasksAssignees).values({
			taskId: newTask.id,
			userId: user.id,
			createdBy: user.id,
			updatedBy: user.id,
		});

		// 3️⃣ Add any other assignees (avoid duplicate of creator)
		if (Array.isArray(assignedUsers) && assignedUsers.length > 0) {
			const assigneesToInsert = Array.from(new Set(assignedUsers.filter((a) => a !== user.id))).map(
				(uid) => ({
					taskId: newTask.id,
					userId: uid,
					createdBy: user.id,
					updatedBy: user.id,
				})
			);

			if (assigneesToInsert.length > 0) {
				await db.insert(tasksAssignees).values(assigneesToInsert);
			}
		}

		return NextResponse.json({ success: true, task: newTask, taskId: newTask.id }, { status: 201 });
	} catch (error) {
		console.error("POST /api/tasks error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

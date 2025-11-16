import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { tasks, tasksAssignees } from "@/db/schema/schema";
import { getUserFromSessionToken } from "@/lib/utils-server";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest) {
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
			return NextResponse.json({ error: "Missing task id" }, { status: 400 });
		}

		const body = await req.json();

		const {
			name,
			priority,
			category,
			publishDate,
			deadlineDate,
			clientStatus,
			taskstatus,
			socialLinks,
			captions,
			assignedUsers = [],
			uploadedFiles = [], // <── updated SAME as create API
		} = body;

		// Fetch existing task
		const existing = await db
			.select()
			.from(tasks)
			.where(eq(tasks.id, Number(taskId)));
		if (!existing.length) {
			return NextResponse.json({ error: "Task not found" }, { status: 404 });
		}

		const existingTask = existing[0];

		// Merge old files + new uploaded files
		const mergedFiles = [
			...(existingTask.files || []),
			...uploadedFiles, // these come from /api/fileupload
		];

		// Update the task
		const [updated] = await db
			.update(tasks)
			.set({
				name: name ?? existingTask.name,
				priority: priority ?? existingTask.priority,
				category: category ?? existingTask.category,
				clientStatus: clientStatus ?? existingTask.clientStatus,
				taskstatus: taskstatus ?? existingTask.taskstatus,
				socialLinks: socialLinks ?? existingTask.socialLinks,
				captions: captions ?? existingTask.captions,
				publishDate: publishDate ? new Date(publishDate) : existingTask.publishDate,
				deadlineDate: deadlineDate ? new Date(deadlineDate) : existingTask.deadlineDate,
				files: mergedFiles,
				updatedBy: user.id,
				updatedAt: new Date(),
			})
			.where(eq(tasks.id, Number(taskId)))
			.returning();

		// Update assignees
		if (Array.isArray(assignedUsers)) {
			// First remove all existing assignees
			await db.delete(tasksAssignees).where(eq(tasksAssignees.taskId, updated.id));

			// Add creator
			await db.insert(tasksAssignees).values({
				taskId: updated.id,
				userId: user.id,
				createdBy: user.id,
				updatedBy: user.id,
			});

			// Add others (skip duplicates)
			const toInsert = Array.from(new Set(assignedUsers.filter((x) => x !== user.id))).map(
				(uid) => ({
					taskId: updated.id,
					userId: uid,
					createdBy: user.id,
					updatedBy: user.id,
				})
			);

			if (toInsert.length) {
				await db.insert(tasksAssignees).values(toInsert);
			}
		}

		return NextResponse.json({ success: true, task: updated });
	} catch (error) {
		console.error("PUT /api/tasks/update error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

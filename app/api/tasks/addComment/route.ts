import { db } from "@/db";
import { tasks, workspaceUsers } from "@/db/schema/schema";
import { getUserFromSessionToken } from "@/lib/utils-server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
	try {
		const sessionToken = req.headers.get("sessionToken");
		if (!sessionToken) {
			return NextResponse.json({ error: "Missing sessionToken" }, { status: 401 });
		}

		const sessionUser = await getUserFromSessionToken(sessionToken);
		if (!sessionUser) {
			return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
		}

		// Get body
		const body = await req.json();
		const { taskId, comment } = body;

		if (!taskId) {
			return NextResponse.json({ error: "Not a valid task" }, { status: 400 });
		}
		if (!comment) {
			return NextResponse.json({ error: "No comment to add." }, { status: 400 });
		}

		const client = await db
			.select()
			.from(workspaceUsers)
			.where(eq(workspaceUsers.userId, sessionUser.id));
		const clientRole = client[0].role;

		if (clientRole !== 6) {
			return NextResponse.json({ error: "User is not a client" }, { status: 401 });
		}

		const existingTask = await db.select().from(tasks).where(eq(tasks.id, taskId));

		if (existingTask.length === 0) {
			return NextResponse.json({ error: "Task not found" }, { status: 404 });
		}

		const oldComments = existingTask[0].clientComment ?? [];

		// Create new comment object
		const newComment = {
			userId: sessionUser.id,
			comment,
			date: new Date().toISOString(),
		};

		const updatedComments = [...oldComments, newComment];

		// Update database
		const updated = await db
			.update(tasks)
			.set({ clientComment: updatedComments })
			.where(eq(tasks.id, taskId))
			.returning();

		return NextResponse.json({ success: true, task: updated[0] });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ error: "Internal server error", detail: error }, { status: 500 });
	}
}

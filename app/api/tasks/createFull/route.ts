import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, tasksAssignees, tasksFiles, mediaContent } from "@/db/schema/schema";
import { getUserFromSessionToken } from "@/lib/utils-server";

export async function POST(req: NextRequest) {
	try {
		const sessionToken = req.headers.get("sessionToken");
		if (!sessionToken) {
			return NextResponse.json({ error: "Missing sessionToken" }, { status: 401 });
		}

		const user = await getUserFromSessionToken(sessionToken);
		if (!user) {
			return NextResponse.json({ error: "Invalid session" }, { status: 401 });
		}

		const body = await req.json();
		const {
			name,
			workspaceId,
			priority,
			category,
			publishDate,
			deadlineDate,
			assignedUsers,
			uploadedFiles,
		} = body;

		if (!name || !workspaceId || !category) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		// 1. Create the task
		const [newTask] = await db
			.insert(tasks)
			.values({
				name,
				workspaceId: Number(workspaceId),
				priority: priority || "MEDIUM",
				category,
				publishDate: publishDate ? new Date(publishDate) : null,
				deadlineDate: deadlineDate ? new Date(deadlineDate) : null,
				createdBy: user.id,
				updatedBy: user.id,
			})
			.returning();

		// 2. Add creator as default assignee
		await db.insert(tasksAssignees).values({
			taskId: newTask.id,
			userId: user.id,
			createdBy: user.id,
			updatedBy: user.id,
		});

		// 3. Add selected assignees
		if (assignedUsers?.length > 0) {
			for (const assigneeId of assignedUsers) {
				await db.insert(tasksAssignees).values({
					taskId: newTask.id,
					userId: assigneeId,
					createdBy: user.id,
					updatedBy: user.id,
				});
			}
		}

		// 4. Upload files to S3 via /api/presigned
		if (uploadedFiles?.length > 0) {
			for (const file of uploadedFiles) {
				const presignedRes = await fetch(
					`${process.env.NEXT_PUBLIC_URL}/api/presigned?fileName=${encodeURIComponent(
						file.name
					)}&contentType=${encodeURIComponent(file.type)}`
				);

				const { signedUrl, fileUrl, originalName } = await presignedRes.json();

				// Upload binary file to S3
				await fetch(signedUrl, {
					method: "PUT",
					body: Buffer.from(file.data),
					headers: {
						"Content-Type": file.type,
					},
				});

				// Save mediaContent entry
				const [media] = await db
					.insert(mediaContent)
					.values({
						userId: user.id,
						url: fileUrl,
						originalName,
						type: file.type.includes("image")
							? "IMAGE"
							: file.type.includes("video")
							? "VIDEO"
							: file.type.includes("pdf")
							? "PDF"
							: "OTHER",
					})
					.returning();

				// Save mapping to the task
				await db.insert(tasksFiles).values({
					taskId: newTask.id,
					mediaId: media.id,
					createdBy: user.id,
					updatedBy: user.id,
				});
			}
		}

		return NextResponse.json({ taskId: newTask.id }, { status: 201 });
	} catch (err) {
		console.error("createFull ERROR:", err);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}

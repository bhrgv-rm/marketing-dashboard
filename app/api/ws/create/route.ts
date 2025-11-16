import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workspaces, workspaceUsers, workspaceClients } from "@/db/schema/schema";
import { getUserFromSessionToken } from "@/lib/utils-server";

export async function POST(req: NextRequest) {
	try {
		const sessionToken = req.headers.get("sessionToken");
		if (!sessionToken) {
			return NextResponse.json({ error: "Missing sessionToken" }, { status: 401 });
		}

		const sessionUser = await getUserFromSessionToken(sessionToken);
		if (!sessionUser) {
			return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
		}

		const body = await req.json();
		const { name, image, information, roles = {} } = body;

		if (!name) {
			return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
		}

		// Create workspace
		const [newWorkspace] = await db
			.insert(workspaces)
			.values({
				name,
				image: image || null,
				information: information || {},
				createdBy: sessionUser.id,
				updatedBy: sessionUser.id,
			})
			.returning();

		// Creator automatically becomes ADMIN (role ID 2)
		await db.insert(workspaceUsers).values({
			workspaceId: newWorkspace.id,
			userId: sessionUser.id,
			role: 2,
		});

		// Extract role arrays
		const { admins = [], managers = [], contentHeads = [], assignees = [], clients = [] } = roles;

		// Convert role → workspace_users rows
		const userRoleRows = [
			...admins.map((uid: string) => ({ userId: uid, role: 2 })),
			...managers.map((uid: string) => ({ userId: uid, role: 3 })),
			...contentHeads.map((uid: string) => ({ userId: uid, role: 4 })),
			...assignees.map((uid: string) => ({ userId: uid, role: 5 })),
			...clients.map((uid: string) => ({ userId: uid, role: 6 })),
		].map((entry) => ({
			workspaceId: newWorkspace.id,
			userId: entry.userId,
			role: entry.role,
		}));

		if (userRoleRows.length > 0) {
			await db.insert(workspaceUsers).values(userRoleRows);
		}

		// CLIENTS go into workspace_clients table
		if (clients.length > 0) {
			const clientRows = clients.map((cid: string) => ({
				workspaceId: newWorkspace.id,
				clientId: cid,
				role: 6,
				createdBy: sessionUser.id,
				updatedBy: sessionUser.id,
			}));

			await db.insert(workspaceClients).values(clientRows);
		}

		return NextResponse.json(
			{ workspaceId: newWorkspace.id, message: "Workspace created" },
			{ status: 201 }
		);
	} catch (error) {
		console.error("POST /api/workspaces/create error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

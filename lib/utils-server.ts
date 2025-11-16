import { db } from "@/db";
import { session, user, workspaceUsers } from "@/db/schema/schema";
import { and, eq, gt } from "drizzle-orm";

export type SessionUser = {
	id: string;
	name: string | null;
	email?: string | null;
	image?: string | null;
};

export async function getUserFromSessionToken(token: string) {
	const result = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			image: user.image,
		})
		.from(session)
		.innerJoin(user, eq(session.userId, user.id))
		.where(and(eq(session.token, token), gt(session.expiresAt, new Date())))
		.limit(1);

	return result.length ? result[0] : null;
}

export async function checkSuperAdmin(token: string) {
	const result = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			image: user.image,
		})
		.from(session)
		.innerJoin(user, eq(session.userId, user.id))
		.where(eq(user.role, "SUPER ADMIN"))
		.limit(1);

	return result.length ? true : false;
}

export async function checkAccessFromToken(
	token: string,
	workspaceId: number,
	allowedRoles: number[]
): Promise<boolean> {
	const sessionResult = await db
		.select({ userId: session.userId })
		.from(session)
		.where(and(eq(session.token, token), gt(session.expiresAt, new Date())))
		.limit(1);

	if (!sessionResult.length) return false;
	const { userId } = sessionResult[0];

	const workspaceRoles = await db
		.select({ roleId: workspaceUsers.role })
		.from(workspaceUsers)
		.where(and(eq(workspaceUsers.userId, userId), eq(workspaceUsers.workspaceId, workspaceId)));

	return workspaceRoles.some((r) => allowedRoles.includes(r.roleId));
}

export const isToday = (date: Date) => {
	const today = new Date();
	return (
		date.getDate() === today.getDate() &&
		date.getMonth() === today.getMonth() &&
		date.getFullYear() === today.getFullYear()
	);
};

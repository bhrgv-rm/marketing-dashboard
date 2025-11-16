// /app/api/fileupload/route.ts
import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { mediaContent } from "@/db/schema/schema";
import { getUserFromSessionToken } from "@/lib/utils-server";

export async function POST(req: NextRequest) {
	try {
		const sessionToken = req.headers.get("sessionToken");
		if (!sessionToken) {
			return NextResponse.json({ error: "Missing session token" }, { status: 401 });
		}

		const user = await getUserFromSessionToken(sessionToken);
		if (!user) {
			return NextResponse.json({ error: "Invalid session" }, { status: 401 });
		}

		const { fileUrl, originalName, contentType } = await req.json();

		if (!fileUrl || !originalName || !contentType) {
			return NextResponse.json({ error: "Missing fields" }, { status: 400 });
		}

		const type = contentType.toLowerCase().includes("image")
			? "IMAGE"
			: contentType.toLowerCase().includes("video")
			? "VIDEO"
			: contentType.toLowerCase().includes("pdf")
			? "PDF"
			: contentType.toLowerCase().includes("audio")
			? "AUDIO"
			: "OTHER";

		const [inserted] = await db
			.insert(mediaContent)
			.values({
				userId: user.id,
				type,
				url: fileUrl,
				originalName,
			})
			.returning();

		return NextResponse.json({ success: true, media: inserted }, { status: 201 });
	} catch (e) {
		console.error("/api/fileupload error:", e);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

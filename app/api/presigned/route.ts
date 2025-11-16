import { NextResponse, type NextRequest } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createId } from "@paralleldrive/cuid2";

export async function GET(request: NextRequest) {
	const accessKeyId = process.env.AWS_KEY_ID;
	const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
	const s3BucketName = process.env.AWS_S3_BUCKET_NAME;

	if (!accessKeyId || !secretAccessKey || !s3BucketName) {
		return new Response(null, { status: 500 });
	}

	const searchParams = request.nextUrl.searchParams;

	// User-provided file name (we only STORE this later)
	const originalName = searchParams.get("fileName");
	const contentType = searchParams.get("contentType");

	if (!originalName || !contentType) {
		return new Response(null, { status: 500 });
	}

	// 1. Build date folder DDMMYYYY
	const now = new Date();
	const dd = String(now.getDate()).padStart(2, "0");
	const mm = String(now.getMonth() + 1).padStart(2, "0");
	const yyyy = now.getFullYear();
	const dateFolder = `${dd}${mm}${yyyy}`;

	// 2. Create unique ID for S3 key
	const uniqueId = createId();

	// 3. Final S3 key → dateFolder/cuid
	const s3Key = `${dateFolder}/${uniqueId}`;

	const client = new S3Client({
		region: "ap-south-1",
		credentials: {
			accessKeyId,
			secretAccessKey,
		},
	});

	const command = new PutObjectCommand({
		Bucket: s3BucketName,
		Key: s3Key,
		ContentType: contentType,
	});

	const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

	if (signedUrl) {
		return NextResponse.json({
			signedUrl,
			fileUrl: `https://${s3BucketName}.s3.ap-south-1.amazonaws.com/${s3Key}`,
			originalName, // send back the user's chosen name
		});
	}

	return new Response(null, { status: 500 });
}

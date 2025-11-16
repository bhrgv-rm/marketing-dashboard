"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Chip from "@/components/chip";
import { useSession } from "@/context/SessionContext";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import dynamic from "next/dynamic";
const Plyr = dynamic(() => import("plyr-react"), {
	ssr: false,
	loading: () => <div className="text-center p-4">Loading video...</div>,
});
import "plyr-react/plyr.css";
import Loading from "@/components/loading";
import Empties from "@/components/empties";
import {
	ChatBubbleLeftEllipsisIcon,
	ClipboardIcon,
	CubeTransparentIcon,
	DocumentTextIcon,
	LinkIcon,
	NoSymbolIcon,
	PhotoIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/button";
import { Modal } from "@/components/modal";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isToday } from "date-fns";
import Dropzone from "@/components/dropzone";
import { useToast, TOAST_TYPES } from "@/components/toaster";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	InstagramLogoIcon,
	FacebookLogoIcon,
	XLogoIcon,
	LinkedinLogoIcon,
	MediumLogoIcon,
	GlobeSimpleIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { Clipboard } from "lucide-react";
import { routerServerGlobal } from "next/dist/server/lib/router-utils/router-server-context";
import { getChipVariant } from "@/lib/utils-client";

interface FileItem {
	id: string;
	url: string;
	type?: string;
}

interface CaptionItem {
	platform: string;
	text: string;
}

interface SocialLink {
	platform: string;
	url: string;
}

interface ClientComment {
	userId: string;
	comment: string;
	date: string;
}

interface Task {
	id: number;
	name: string;
	workspaceId: number;
	priority: string;
	category: string;
	files: FileItem[];
	publishDate: string;
	deadlineDate: string;
	captions: CaptionItem[];
	socialLinks: SocialLink[];
	clientComment: ClientComment[];
	taskstatus: string;
	clientStatus: string;
	createdAt: string;
	createdBy: string;
	updatedAt: string;
	updatedBy: string;
}

interface UserProfile {
	id: string;
	name: string;
	image: string | null;
}
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export default function TaskPage() {
	const params = useParams();
	const router = useRouter();
	const commentsRef = useRef<HTMLUListElement>(null);
	const id = params?.id as string;
	const { token, user } = useSession();

	const [task, setTask] = useState<Task | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [editing, setEditing] = useState<boolean>(false);

	// Form state
	const [name, setName] = useState("");
	const [priority, setPriority] = useState("MEDIUM");
	const [category, setCategory] = useState("REELS");
	const [publishDate, setPublishDate] = useState<Date | undefined>();
	const [deadlineDate, setDeadlineDate] = useState<Date | undefined>();
	const [taskStatus, setTaskStatus] = useState("IDEATION");
	const [clientStatus, setClientStatus] = useState("");
	const [files, setFiles] = useState<FileItem[]>([]);
	const [captions, setCaptions] = useState<CaptionItem[]>([]);
	const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
	const [formLoading, setFormLoading] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
	const [role, setRole] = useState<number>(0);
	const [commentText, setCommentText] = useState("");
	const [refresh, setRefresh] = useState(0);

	const [usersMap, setUsersMap] = useState<Record<string, UserProfile>>({});

	const toast = useToast();

	useEffect(() => {
		if (task && usersMap) {
			const comments = (task.clientComment || []).map((c: any) => ({
				...c,
				user: usersMap[c.userId],
			}));
		}
	}, [task, usersMap]);

	const handleFiles = (files: File[]) => {
		setUploadedFiles(files);
	};

	const handleAddComment = async () => {
		if (!commentText.trim()) {
			toast.addToast("Comment cannot be empty", TOAST_TYPES.ERROR);
			return;
		}

		setCommentText("");

		try {
			const res = await fetch("/api/tasks/addComment", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(token ? { sessionToken: token } : {}),
				},
				body: JSON.stringify({
					taskId: task?.id,
					comment: commentText,
				}),
			});

			if (!commentsRef.current)
				toast.addToast("Comment added but failed to add here. Reload to see.", TOAST_TYPES.INFO);
			const li = document.createElement("li");
			li.className = "px-4 py-2 rounded bg-gray-100 flex gap-4 border shadow-inner";

			li.innerHTML = `
    <img
      src="${user?.image || "/default-user.png"}"
      class="size-12 rounded-full border object-cover"
    />

    <div class="flex flex-col gap-1">
      <p class="font-medium text-xs text-gray-500">
        ${user?.name || "Unknown User"} ●
        ${new Date().toLocaleString()}
      </p>
      <p class="font-medium">${commentText}</p>
    </div>
  `;

			commentsRef.current?.prepend(li);
			document.getElementById("empty-comments-state")?.remove();

			toast.addToast(`Comment added to ${task?.name}`, TOAST_TYPES.SUCCESS);

			if (!res.ok) {
				setCommentText(commentText);
				toast.addToast("Failed to add comment", TOAST_TYPES.ERROR);
				return;
			}
		} catch (err) {
			console.error(err);
			setCommentText("");
			toast.addToast("Something went wrong", TOAST_TYPES.ERROR);
		}
	};

	useEffect(() => {
		const fetchTask = async () => {
			try {
				setLoading(true);
				setError(null);

				if (!token) {
					setError("You need to sign in to view tasks.");
					setLoading(false);
					return;
				}

				const res = await fetch(`${BASE_URL}/api/tasks/getTask?id=${id}`, {
					headers: {
						"Content-Type": "application/json",
						sessionToken: token,
					},
					cache: "no-store",
				});

				if (!res.ok) {
					setError(`Failed to fetch task from the database (${res.status})`);
					setLoading(false);
					return;
				}

				const data = await res.json();
				const t = Array.isArray(data) ? data[0] : data;
				setTask(t);
				const comments = Array.isArray(t.clientComment) ? t.clientComment : [];
				const commentUserIds = [...new Set(comments.map((c: any) => c.userId))];

				if (commentUserIds.length > 0) {
					const resUsers = await fetch(`/api/user/getMany`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							sessionToken: token,
						},
						body: JSON.stringify({ ids: commentUserIds }),
					});

					const usersArr = await resUsers.json();

					// Convert array → hash map for quick lookup
					const map: any = {};
					usersArr.forEach((u: any) => {
						map[u.id] = u;
					});

					setUsersMap(map);
				}

				setName(t.name);
				setPriority(t.priority);
				setCategory(t.category);
				setTaskStatus(t.taskstatus);
				setClientStatus(t.clientStatus);
				setPublishDate(t.publishDate ? new Date(t.publishDate) : undefined);
				setDeadlineDate(t.deadlineDate ? new Date(t.deadlineDate) : undefined);
				setFiles(t.files || []);
				setCaptions(t.captions || []);
				setSocialLinks(t.socialLinks || []);

				const sessionRole = await fetch(`/api/user/getRoleforWS?workspaceId=${18}`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						sessionToken: token,
					},
				});
				const sessionJson = await sessionRole.json();
				setRole(sessionJson[0]?.role);
			} catch (err) {
				console.error("Error fetching task:", err);
				setError("Something went wrong while fetching the task.");
			} finally {
				setLoading(false);
			}
		};

		if (id && token) fetchTask();
	}, [id, token, refresh]);

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setFormLoading(true);
		setFormError(null);

		try {
			// Merge existing files + newly uploaded ones
			const mergedFiles = [
				...files, // existing
				...uploadedFiles.map((f: any) => ({
					id: null, // marks as new for backend
					url: f.url, // must come from your uploader
					type: f.type === "application/pdf" ? "PDF" : "IMAGE",
					originalName: f.name,
				})),
			];

			const res = await fetch(`/api/tasks/updateTask?id=${task?.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					...(token ? { sessionToken: token } : {}),
				},
				body: JSON.stringify({
					name,
					priority,
					category,
					taskstatus: taskStatus,
					clientStatus,
					publishDate: publishDate ? publishDate.toISOString() : null,
					deadlineDate: deadlineDate ? deadlineDate.toISOString() : null,
					files: mergedFiles,
					captions,
					socialLinks,
				}),
			});

			if (!res.ok) {
				const err = await res.json();
				setFormError(err.error || "Failed to update task");
				return;
			}

			const updated = await res.json();
			setTask(updated);
			setUploadedFiles([]);
			setEditing(false);
			toast.addToast("Task updated", TOAST_TYPES.SUCCESS);
			setRefresh((r) => r + 1);
		} catch (error) {
			console.error(error);
			setFormError("Something went wrong");
		} finally {
			setFormLoading(false);
		}
	};

	if (loading) return <Loading />;

	return (
		<>
			{error ? (
				<Empties
					icon={<NoSymbolIcon className="size-12" />}
					title={error}
					description="The returned task seems to be empty. You might not be assigned to this task."
				/>
			) : !task ? (
				<Empties
					title="No task found with the given information"
					description="There might be an error with the database or the task has been deleted"
					icon={<CubeTransparentIcon className="size-12" />}
				/>
			) : (
				<div className="max-w-5xl mx-auto mt-12 px-4">
					<div className="flex justify-between items-center gap-2 mb-2">
						<h1 className="text-2xl font-black">{task.name}</h1>
						{role !== 6 && (
							<Button variant="secondary" onClick={() => setEditing(true)}>
								Edit Task Details
							</Button>
						)}
					</div>

					<div className="flex flex-wrap gap-1 mb-4">
						<div
							className="grid gap-1.5 items-center"
							style={{ gridTemplateColumns: "minmax(150px, auto) 1fr" }}>
							<span className="font-medium">Priority:</span>
							<Chip
								value={task.priority || "N/A"}
								variant={getChipVariant(task.deadlineDate, task.clientStatus)}
							/>

							<span className="font-medium">Category:</span>
							<Chip value={task.category || "N/A"} variant="default" />

							<span className="font-medium">Status:</span>
							<Chip value={task.taskstatus || "N/A"} variant="default" />

							<span className="font-medium">Client Status:</span>
							<Chip value={task.clientStatus || "N/A"} variant="default" />

							<span className="font-medium">Publish Date:</span>
							<Chip
								value={task.publishDate ? format(task.publishDate, "PPP") : "N/A"}
								variant={getChipVariant(task.publishDate, task.clientStatus)}
							/>

							<span className="font-medium">Deadline:</span>
							<Chip
								value={task.deadlineDate ? format(task.deadlineDate, "PPP") : "N/A"}
								variant={getChipVariant(task.deadlineDate, task.clientStatus)}
							/>
						</div>
					</div>

					{/* Files */}
					<h2 className="text-xl font-semibold mb-3">Files</h2>
					{task.files?.length > 0 ? (
						<div className="mb-4">
							<Carousel className="w-full max-w-3xl mx-auto">
								<CarouselContent>
									{task.files.map((file) => (
										<CarouselItem key={file.id} className="flex justify-center">
											<div className="relative w-full max-h-[500px] rounded-2xl flex justify-center items-center">
												{file.type === "VIDEO" ? (
													<div className="w-full h-auto rounded-lg overflow-hidden shadow-md">
														<Plyr
															source={{
																type: "video",
																sources: [{ src: file.url, type: "video/mp4" }],
															}}
														/>
													</div>
												) : file.type === "PDF" ? (
													<iframe
														src={file.url}
														title={`Task file ${file.id}`}
														className="w-full h-[600px] border-2 rounded-lg shadow-md"></iframe>
												) : (
													<img
														src={file.url}
														alt={`Task file ${file.id}`}
														className="border-2 w-full h-auto object-contain rounded-lg shadow-md"
													/>
												)}
											</div>
										</CarouselItem>
									))}
								</CarouselContent>
								<CarouselPrevious />
								<CarouselNext />
							</Carousel>
						</div>
					) : (
						<Empties
							title="No files added to this task."
							description="Add any files for this task to see here. Remember to compress the files before adding."
							icon={<PhotoIcon className="size-12" />}
						/>
					)}

					{/* Socials */}
					<h2 className="text-xl font-semibold mt-4 mb-2">Links</h2>
					{task.socialLinks?.length > 0 ? (
						<div className="mb-6">
							<div className="flex items-center gap-2">
								{task.socialLinks.map((cap, idx) => (
									<a
										href={cap.url}
										target="_blank"
										key={idx}
										className="px-4 py-2 rounded transition duration-200 flex items-center justify-start gap-4 h-fit bg-gray-100 text-gray-800 border shadow-inner">
										{cap.platform === "instagram" && <InstagramLogoIcon className="size-8" />}
										{cap.platform === "facebook" && <FacebookLogoIcon className="size-8" />}
										{cap.platform === "twitter" && <XLogoIcon className="size-8" />}
										{cap.platform === "linkedin" && <LinkedinLogoIcon className="size-8" />}
										{cap.platform === "medium" && <MediumLogoIcon className="size-8" />}
										{cap.platform === "website" && <GlobeSimpleIcon className="size-8" />}
										<h1 className="font-semibold">{cap.platform.toLocaleUpperCase()}</h1>
									</a>
								))}
							</div>
						</div>
					) : (
						<Empties
							title="No links provided."
							description="Added links will be shown here."
							icon={<LinkIcon className="size-12" />}
						/>
					)}

					{/* Captions */}
					<h2 className="text-xl font-semibold mb-2 mt-4">Captions</h2>
					{task.captions?.length > 0 ? (
						<div className="mt-2">
							<Tabs
								defaultValue={task.captions[0]?.platform ?? ""}
								className="w-full mx-auto border rounded-lg">
								<TabsList className="w-full overflow-x-auto justify-start border-b">
									{task.captions.map((cap, idx) => (
										<TabsTrigger
											key={idx}
											value={cap.platform}
											className="flex cursor-pointer items-center gap-2">
											{cap.platform === "instagram" && <InstagramLogoIcon className="size-4" />}
											{cap.platform === "facebook" && <FacebookLogoIcon className="size-4" />}
											{cap.platform === "twitter" && <XLogoIcon className="size-4" />}
											{cap.platform === "linkedin" && <LinkedinLogoIcon className="size-4" />}
											{cap.platform.toUpperCase()}
										</TabsTrigger>
									))}
								</TabsList>

								{/* Content per platform */}
								{task.captions.map((cap, idx) => (
									<TabsContent
										key={idx}
										value={cap.platform}
										className="p-4 pt-1 space-y-3relative">
										<div className="flex gap-4">
											<span className="w-full">{cap.text}</span>
											<button
												onClick={() => {
													navigator.clipboard.writeText(cap.text);
													toast.addToast("Copied to Clipboard", TOAST_TYPES.INFO);
												}}
												className="h-fit w-min py-1 px-2 shadow-xs flex items-center justify-center text-sm border rounded-md">
												<ClipboardIcon className="size-6" /> Copy
											</button>
										</div>
									</TabsContent>
								))}
							</Tabs>
						</div>
					) : (
						<Empties
							title="No captions given."
							description="Added captions will be shown here."
							icon={<DocumentTextIcon className="size-12" />}
						/>
					)}

					<h2 className="text-xl font-semibold mt-6 mb-2">From the Client</h2>
					{role === 6 && (
						<>
							<div className="w-1/2 mb-4">
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Client Status
								</label>
								<Select
									value={clientStatus}
									onValueChange={async (value) => {
										setClientStatus(value);

										try {
											const res = await fetch("/api/tasks/changeClientStatus", {
												method: "POST",
												headers: {
													"Content-Type": "application/json",
													sessionToken: token || "",
												},
												body: JSON.stringify({
													taskId: task?.id,
													status: value,
												}),
											});

											const json = await res.json();

											if (!res.ok) {
												console.error(json.error);
												toast.addToast(json.error || "Failed to update status", TOAST_TYPES.ERROR);
												return;
											}
											setTask((prev) => {
												if (!prev) return prev; // keep null state safe

												return {
													...prev,
													clientStatus: value,
												};
											});

											toast.addToast("Client status updated", TOAST_TYPES.SUCCESS);
										} catch (err) {
											console.error(err);
											toast.addToast("Something went wrong", TOAST_TYPES.ERROR);
										}
									}}>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select client status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="APPROVED">APPROVED</SelectItem>
										<SelectItem value="CHANGES">CHANGES</SelectItem>
										<SelectItem value="DECLINED">DECLINED</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex items-center gap-2 mb-2">
								<input
									className="border-black border outline-0 flex-1 p-2"
									value={commentText}
									onChange={(e) => setCommentText(e.target.value)}
									placeholder="Add a comment..."
								/>
								<Button className="w-max" onClick={handleAddComment}>
									Add Comment
								</Button>
							</div>
						</>
					)}

					{task.clientComment?.length === 0 ||
						(task.clientComment === null && (
							<div className="empty-state mb-4" id="empty-comments-state">
								<Empties
									title="No comments from the clients."
									description="Client comments are shown here."
									icon={<ChatBubbleLeftEllipsisIcon className="size-12" />}
								/>
							</div>
						))}
					<ul className="space-y-2 mb-4" ref={commentsRef}>
						{task.clientComment?.length > 0 &&
							task.clientComment
								.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
								.map((comment, idx) => {
									const user = usersMap[comment.userId];
									return (
										<li
											key={idx}
											className="px-4 py-2 rounded bg-gray-100 flex gap-4 border shadow-inner">
											<img
												src={user?.image || "/default-user.png"}
												className="size-12 rounded-full border object-cover"
											/>

											<div className="flex flex-col gap-1">
												<p className="font-medium text-xs text-gray-500">
													{user?.name || "Unknown User"} • {new Date(comment.date).toLocaleString()}
												</p>
												<p className="font-medium">{comment.comment}</p>
											</div>
										</li>
									);
								})}
					</ul>
				</div>
			)}

			{/* Edit Modal */}
			{editing && task && (
				<Modal
					isModalOpen={true}
					onCloseExternal={() => setEditing(false)}
					title={`Editing ${task.name}`}>
					<form onSubmit={onSubmit} className="space-y-4">
						<Modal.Body>
							{/* Task Name */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
								<input
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="w-full border rounded-md p-2"
									required
								/>
							</div>
							<div className="flex w-full gap-2 mt-2">
								<div className="w-1/2">
									<label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
									<Select value={priority} onValueChange={setPriority}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select priority" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="LOW">LOW</SelectItem>
											<SelectItem value="MEDIUM">MEDIUM</SelectItem>
											<SelectItem value="HIGH">HIGH</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="w-1/2">
									<label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
									<Select value={category} onValueChange={setCategory}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select category" />
										</SelectTrigger>
										<SelectContent>
											{["REELS", "SHORTS", "POSTS", "ADS", "BLOGS", "VIDEOS"].map((c) => (
												<SelectItem key={c} value={c}>
													{c}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Task Status */}
							<div className="flex w-full gap-2 my-2">
								{/* Task Status */}
								<div className="w-1/2">
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Task Status
									</label>
									<Select value={taskStatus} onValueChange={setTaskStatus}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent>
											{[
												"IDEATION",
												"DEVELOPMENT",
												"INTERNAL REVIEW",
												"CLIENT REVIEW",
												"REVISION REQUESTED",
												"APPROVED BY CLIENT",
												"READY TO PUBLISH",
												"HOLD",
												"PUBLISHED",
												"SHELVED",
											].map((s) => (
												<SelectItem key={s} value={s}>
													{s}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Dates */}
							<div className="grid grid-cols-2 gap-2 mb-2">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Publish Date
									</label>
									<Popover>
										<PopoverTrigger asChild>
											<Button variant="outline" className="w-full text-left">
												{publishDate ? format(publishDate, "PPP") : "Select date"}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0">
											<Calendar
												mode="single"
												selected={publishDate}
												onSelect={setPublishDate}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Deadline Date
									</label>
									<Popover>
										<PopoverTrigger asChild>
											<Button variant="outline" className="w-full text-left">
												{deadlineDate ? format(deadlineDate, "PPP") : "Select date"}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0">
											<Calendar
												mode="single"
												selected={deadlineDate}
												onSelect={setDeadlineDate}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
								</div>
							</div>

							{/* Captions */}
							<div>
								<div className="flex items-center justify-between mb-2">
									<label className="block text-sm font-medium text-gray-700 my-1">Captions</label>

									<Button
										type="button"
										onClick={() => setCaptions((prev) => [...prev, { platform: "", text: "" }])}>
										Add Caption
									</Button>
								</div>
								{captions.map((c, i) => (
									<div key={i} className="flex gap-2 mb-2">
										<Select
											value={c.platform}
											onValueChange={(val) =>
												setCaptions((prev) => {
													const copy = [...prev];
													copy[i].platform = val;
													return copy;
												})
											}>
											{" "}
											<SelectTrigger className="w-40">
												<SelectValue placeholder="Select priority" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="instagram">
													<InstagramLogoIcon className="size-6" /> Instagram
												</SelectItem>
												<SelectItem value="facebook">
													<FacebookLogoIcon className="size-6" /> Facebook
												</SelectItem>
												<SelectItem value="twitter">
													<XLogoIcon className="size-6" /> X
												</SelectItem>
												<SelectItem value="linkedin">
													<LinkedinLogoIcon className="size-6" /> LinkedIn
												</SelectItem>
											</SelectContent>
										</Select>
										<input
											type="text"
											placeholder="Text"
											value={c.text}
											onChange={(e) =>
												setCaptions((prev) => {
													const copy = [...prev];
													copy[i].text = e.target.value;
													return copy;
												})
											}
											className="flex-1 border rounded-md p-1"
										/>
										<Button
											type="button"
											variant="secondary"
											onClick={() => setCaptions((prev) => prev.filter((_, idx) => idx !== i))}>
											Delete
										</Button>
									</div>
								))}
							</div>

							{/* Social Links */}
							<div>
								<div className="flex items-center justify-between mb-2">
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Social Links
									</label>
									<Button
										type="button"
										onClick={() => setSocialLinks((prev) => [...prev, { platform: "", url: "" }])}>
										Add Social Link
									</Button>
								</div>
								{socialLinks.map((s, i) => (
									<div key={i} className="flex gap-2 mb-2">
										<Select
											value={s.platform}
											onValueChange={(val) =>
												setSocialLinks((prev) => {
													const copy = [...prev];
													copy[i].platform = val;
													return copy;
												})
											}>
											{" "}
											<SelectTrigger className="w-40">
												<SelectValue placeholder="Select Social Media" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="instagram">
													<InstagramLogoIcon className="size-6" /> Instagram
												</SelectItem>
												<SelectItem value="facebook">
													<FacebookLogoIcon className="size-6" /> Facebook
												</SelectItem>
												<SelectItem value="twitter">
													<XLogoIcon className="size-6" /> X
												</SelectItem>
												<SelectItem value="linkedin">
													<LinkedinLogoIcon className="size-6" /> LinkedIn
												</SelectItem>
												<SelectItem value="medium">
													<MediumLogoIcon className="size-6" /> Medium
												</SelectItem>
												<SelectItem value="website">
													<GlobeSimpleIcon className="size-6" /> Website
												</SelectItem>
											</SelectContent>
										</Select>
										<input
											type="text"
											placeholder="URL"
											value={s.url}
											onChange={(e) =>
												setSocialLinks((prev) => {
													const copy = [...prev];
													copy[i].url = e.target.value;
													return copy;
												})
											}
											className="flex-1 border rounded-md p-1"
										/>
										<Button
											type="button"
											variant="secondary"
											onClick={() => setSocialLinks((prev) => prev.filter((_, idx) => idx !== i))}>
											Delete
										</Button>
									</div>
								))}
							</div>

							{formError && <p className="text-red-600">{formError}</p>}
						</Modal.Body>
						<Modal.Footer>
							<div className="flex justify-end gap-2 mt-2">
								<Button type="button" variant="secondary" onClick={() => setEditing(false)}>
									Cancel
								</Button>
								<Button type="submit" disabled={formLoading}>
									{formLoading ? "Updating..." : "Update Task"}
								</Button>
							</div>
						</Modal.Footer>
					</form>
				</Modal>
			)}
		</>
	);
}

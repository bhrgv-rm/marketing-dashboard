"use client";
import Input from "@/components/input";
import Button from "@/components/button";
import { useSession } from "@/context/SessionContext";
import React, { useState, useEffect } from "react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useToast, TOAST_TYPES } from "@/components/toaster";
import Dropzone from "@/components/dropzone";
import Empties from "@/components/empties";
import {
	ExclamationCircleIcon,
	InformationCircleIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import InfoTooltip from "@/components/info-tooltip";
import { useRouter } from "next/navigation";
import Loading from "@/components/loading";

const Page = ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = React.use(params);
	const router = useRouter();

	const [allUsers, setAllUsers] = useState<any[]>([]);
	const [loadingUsers, setLoadingUsers] = useState(false);
	const { token, loading: sessionLoading } = useSession();
	const [workspaces, setWorkspaces] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [superAdmin, setSuperAdmin] = useState(false);
	const [role, setRole] = useState<number>(0);
	const [error, setError] = useState<string | null>(null);
	const toast = useToast();
	const [taskName, setTaskName] = useState("");
	const [selectedPriority, setSelectedPriority] = useState<string>("");
	const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
	const [publishDate, setPublishDate] = useState<Date | undefined>(undefined);
	const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);
	const [assignedUsers, setAssignedUsers] = useState<string[]>([]);
	const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

	const handleFiles = (files: File[]) => {
		setUploadedFiles(files);
	};

	const UserSelect = ({
		label,
		value,
		onSelect,
		options,
	}: {
		label: string;
		value: string;
		onSelect: (v: string) => void;
		options: any[];
	}) => (
		<div>
			<label className="text-sm font-semibold">{label}</label>
			<Select value={value} onValueChange={onSelect}>
				<SelectTrigger className="w-full mt-1">
					<SelectValue placeholder={loadingUsers ? "Loading..." : "Select People"} />
				</SelectTrigger>

				<SelectContent className="max-h-64">
					{options.map((u: any) => (
						<SelectItem key={u.id} value={u.id}>
							<div className="flex items-center gap-4">
								<img src={u.image} className="size-10 rounded-full border" alt="" />
								<div className="flex flex-col">
									<p className="font-bold">{u.name}</p>
									<p className="text-sm">{u.email}</p>
								</div>
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);

	const renderChips = (ids: string[], setter: any) => (
		<div className="mt-2 flex flex-wrap gap-2">
			{ids.map((id) => {
				const u = allUsers.find((x) => x.id === id);
				return (
					<div
						key={id}
						className="flex items-center gap-2 pr-3 pl-1 py-1 border border-foreground bg-sidebar-accent rounded-full text-sm">
						<img src={u.image} className="w-6 rounded-full" alt="" />
						<span>{u?.name}</span>
						<button onClick={() => setter((prev: string[]) => prev.filter((x) => x !== id))}>
							<XMarkIcon className="size-4 cursor-pointer" />
						</button>
					</div>
				);
			})}
		</div>
	);

	const fetchWorkspaces = async () => {
		try {
			if (!token) {
				setError("Missing Session Token");
				return;
			}

			const res = await fetch(`/api/ws/get?workspaceId=${id}`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					sessionToken: token,
				},
			});

			const wsData = await res.json();
			const list = Array.isArray(wsData) ? wsData : wsData.workspaces || [];
			setWorkspaces(list);

			const accessUsers = await fetch(`/api/ws/getAccessUsers?workspaceId=${id}`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					sessionToken: token,
				},
			});

			const access = await accessUsers.json();
			setAllUsers(access);

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
			console.error("Failed to fetch workspaces:", err);
			setError("Failed to fetch workspaces");
		} finally {
			setLoading(false);
		}
	};

	if (role === 6) {
		router.push("/workspaces");
	}

	useEffect(() => {
		if (!sessionLoading && token) {
			fetchWorkspaces();
		}
	}, [token, sessionLoading]);

	const handleSubmit = async () => {
		if (!token) return;

		if (!taskName || !selectedCategory) {
			toast.addToast("Please fill all required fields", TOAST_TYPES.ERROR);
			return;
		}

		try {
			// 1) Upload files to S3 + persist to media_content
			const persistedMediaRows: any[] = [];

			for (const file of uploadedFiles) {
				// 1a: get presigned
				const presignedRes = await fetch(
					`/api/presigned?fileName=${encodeURIComponent(
						file.name
					)}&contentType=${encodeURIComponent(file.type)}`
				);

				if (!presignedRes.ok) {
					const err = await presignedRes.text();
					console.error("presigned error:", err);
					throw new Error("Failed to get presigned url");
				}

				const { signedUrl, fileUrl, originalName } = await presignedRes.json();

				// 1b: PUT file binary to S3
				const putRes = await fetch(signedUrl, {
					method: "PUT",
					body: file, // browser File works fine
					headers: {
						"Content-Type": file.type,
					},
				});

				if (!putRes.ok) {
					const err = await putRes.text();
					console.error("S3 upload error:", err);
					throw new Error("Failed to upload file to S3");
				}

				// 1c: tell your API to insert a mediaContent row
				const recordRes = await fetch(`/api/fileupload`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						sessionToken: token,
					},
					body: JSON.stringify({
						fileUrl,
						originalName: originalName || file.name,
						contentType: file.type,
					}),
				});

				const recordJson = await recordRes.json();
				if (!recordRes.ok) {
					console.error("fileupload api error:", recordJson);
					throw new Error(recordJson.error || "Failed to save media record");
				}

				// recordJson.media contains the inserted media row (id, url, originalName, ...)
				persistedMediaRows.push(recordJson.media);
			}

			// 2) Create the task and pass the persisted media rows and assignees
			const res = await fetch(`/api/tasks/create`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					sessionToken: token,
				},
				body: JSON.stringify({
					name: taskName,
					workspaceId: id,
					priority: selectedPriority,
					category: selectedCategory,
					publishDate: publishDate ? publishDate.toISOString() : undefined,
					deadlineDate: deadlineDate ? deadlineDate.toISOString() : undefined,
					assignedUsers, // array of user ids
					uploadedFiles: persistedMediaRows, // array of media rows to be stored in tasks.files
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				toast.addToast(data.error || "Failed to create task", TOAST_TYPES.ERROR);
				return;
			}

			toast.addToast("Task created successfully!", TOAST_TYPES.SUCCESS);

			router.push(`/tasks/${data.taskId}`);
		} catch (err: any) {
			console.error("create task flow error:", err);
			toast.addToast(err.message || "Failed to create task", TOAST_TYPES.ERROR);
		}
	};

	if (loading || sessionLoading) {
		return <Loading />;
	}

	return (
		<>
			<div className="max-w-5xl mx-auto mt-12 px-4">
				{error && (
					<Empties
						title={error}
						icon={<ExclamationCircleIcon className="size-10" />}
						description="Error occured."
					/>
				)}
				<div className="flex justify-between items-center">
					<h1 className="text-2xl font-black mb-6">Creating a New Task in {workspaces[0].name}</h1>

					{[1, 2].includes(role) ? (
						<InfoTooltip icon={<InformationCircleIcon className="size-6" />}>
							You are an admin in this workspace. You can assign access the members for this task.
						</InfoTooltip>
					) : (
						<InfoTooltip icon={<InformationCircleIcon className="size-6" />}>
							The ones above will have access to read or edit the tasks that you create.
						</InfoTooltip>
					)}
				</div>
				<Input
					label="Name of the Task"
					placeholder="Brand Guidelines"
					value={taskName}
					onChange={(e) => setTaskName(e.target.value)}
				/>

				<div className="mt-4 flex gap-2">
					<div className="w-1/2">
						<label>Task Priority</label>
						<Select value={selectedPriority} onValueChange={setSelectedPriority}>
							<SelectTrigger className="w-full mt-1">
								<SelectValue placeholder="Priority" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{["LOW", "MEDIUM", "HIGH"].map((p) => (
										<SelectItem key={p} value={p}>
											{p}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					<div className="w-1/2">
						<label>Category</label>
						<Select value={selectedCategory} onValueChange={setSelectedCategory}>
							<SelectTrigger className="w-full mt-1">
								<SelectValue placeholder="Content Category" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{["REELS", "SHORTS", "POSTS", "ADS", "BLOGS", "VIDEOS", "OTHERS"].map((c) => (
										<SelectItem key={c} value={c}>
											{c}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				</div>
				<div className="flex gap-2 mt-4">
					<div className="w-1/2">
						<label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" className="w-full text-left">
									{publishDate ? format(publishDate, "PPP") : "Select Publish Date"}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0">
								<Calendar
									mode="single"
									selected={publishDate}
									onSelect={(date) => setPublishDate(date || undefined)}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
					</div>

					<div className="w-1/2">
						<label className="block text-sm font-medium text-gray-700 mb-1">Deadline Date</label>
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" className="w-full text-left">
									{deadlineDate ? format(deadlineDate, "PPP") : "Select Deadline Date"}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0">
								<Calendar
									mode="single"
									selected={deadlineDate}
									onSelect={(date) => setDeadlineDate(date || undefined)}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
					</div>
				</div>
				{/* Assign Assignees Section */}
				{[1, 2, 3, 4].includes(role) && (
					<div className="mt-6">
						<h2 className="text-lg font-semibold mb-2">Assign Assignees</h2>

						<UserSelect
							label="Add Assignee"
							value=""
							onSelect={(userId) => {
								// avoid duplicates
								setAssignedUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
							}}
							options={allUsers.filter((u) => u.role === 5)}
						/>

						{assignedUsers.length > 0 && renderChips(assignedUsers, setAssignedUsers)}
					</div>
				)}

				<Dropzone onFilesSelected={handleFiles} />
				<Button className="mt-6" onClick={handleSubmit}>
					Create Task
				</Button>
			</div>
		</>
	);
};

export default Page;

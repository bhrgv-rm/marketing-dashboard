"use client";

import React, { useEffect, useState } from "react";
import { getSession } from "@/lib/auth-client";
import Chip from "@/components/chip";
import Loading from "@/components/loading";
import Empties from "@/components/empties";
import { InformationCircleIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import dynamic from "next/dynamic";
const Plyr = dynamic(() => import("plyr-react"), {
	ssr: false,
	loading: () => <div className="text-center p-4">Loading video...</div>,
});
import "plyr-react/plyr.css";
import InfoTooltip from "@/components/info-tooltip";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";

interface TaskFile {
	id: string | number;
	url: string;
	type: string;
	originalName?: string;
}

interface Task {
	id: string | number;
	name: string;
	priority: string | null;
	category: string | null;
	publishDate: string | null;
	deadlineDate: string | null;
	taskStatus: string | null;
	clientStatus: string | null;
	workspaceId: string | number;
	workspaceName: string;
	workspaceImage: string | null;
	createdAt: string;
	createdBy: string;
	files?: TaskFile[];
}

interface User {
	id: string;
	name?: string;
	email?: string;
	image?: string | null;
}

const Page = () => {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [user, setUser] = useState<User | null>(null);

	// search term
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		const fetchTasks = async () => {
			try {
				setLoading(true);
				setError(null);

				const { data: sessionData } = await getSession();
				const sessionToken = sessionData?.session?.token;
				const currentUser = sessionData?.user;
				setUser(currentUser ?? null);

				if (!sessionToken) {
					setError("You need to sign in to view tasks.");
					setLoading(false);
					return;
				}

				const response = await fetch("/api/tasks/get", {
					headers: { sessionToken },
				});

				const result = await response.json();

				if (!response.ok) {
					setError(result.error || "Failed to fetch tasks.");
					setLoading(false);
					return;
				}

				setTasks(result || []);
			} catch (err) {
				console.error("Error fetching tasks:", err);
				setError("Something went wrong while fetching tasks.");
			} finally {
				setLoading(false);
			}
		};

		fetchTasks();
	}, []);

	// Filter tasks based on search
	const filtered = tasks.filter((task) => {
		const q = searchTerm.toLowerCase();
		return (
			task.name.toLowerCase().includes(q) ||
			task.workspaceName.toLowerCase().includes(q) ||
			(task.priority ?? "").toLowerCase().includes(q) ||
			(task.taskStatus ?? "").toLowerCase().includes(q)
		);
	});

	return (
		<>
			<div className="max-w-5xl mx-auto mt-12 px-4">
				<div className="flex justify-between items-start mb-6">
					<div className="flex items-center gap-2">
						<h1 className="text-2xl font-black">Tasks Assigned</h1>
						<InfoTooltip icon={<InformationCircleIcon className="size-6" />}>
							When a task has multiple uploaded files, swipe left or right to view them.
						</InfoTooltip>
					</div>
				</div>
				<div className="relative w-full">
					<MagnifyingGlassIcon className="absolute top-2.5 left-2.5" />
					<input
						type="text"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="Search tasks..."
						className="border rounded-md px-3 pl-8 py-2 text-sm focus:outline-none focus:ring w-full mb-4"
					/>
					{searchTerm !== "" && (
						<XIcon
							className="absolute  top-2.5 right-2.5 cursor-pointer"
							onClick={() => setSearchTerm("")}
						/>
					)}
				</div>

				{loading && <Loading />}

				{error && (
					<div className="text-red-500">
						<p>{error}</p>
						<button onClick={() => window.location.reload()} className="mt-2 text-sm underline">
							Retry
						</button>
					</div>
				)}

				{!loading && !error && filtered.length === 0 && (
					<Empties
						title="No tasks found."
						description="Try adjusting your search."
						icon={<PencilSquareIcon className="size-12" />}
					/>
				)}
				{filtered.length > 0 && (
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>
										<h1 className="font-bold uppercase">Name</h1>
									</TableHead>
									<TableHead>
										<h1 className="font-bold uppercase">Workspace</h1>
									</TableHead>
									<TableHead>
										<h1 className="font-bold uppercase">Priority</h1>
									</TableHead>
									<TableHead>
										<h1 className="font-bold uppercase">Work Status</h1>
									</TableHead>
									<TableHead>
										<h1 className="font-bold uppercase">Client Status</h1>
									</TableHead>
									<TableHead>
										<h1 className="font-bold uppercase">Publish Date</h1>
									</TableHead>
									<TableHead>
										<h1 className="font-bold uppercase">Deadline</h1>
									</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{filtered
									.slice()
									.sort((a, b) => Number(a.id) - Number(b.id))
									.map((task) => (
										<TableRow
											key={task.id}
											className="cursor-pointer hover:bg-muted/50 transition"
											onClick={() => (window.location.href = `/tasks/${task.id}`)}>
											<TableCell className="font-medium">{task.name}</TableCell>
											<TableCell className="font-medium">{task.workspaceName}</TableCell>
											<TableCell>{task.priority}</TableCell>
											<TableCell>{task.taskStatus}</TableCell>
											<TableCell>{task.clientStatus}</TableCell>
											<TableCell>
												{task.publishDate ? format(task.publishDate, "PPP") : "-"}
											</TableCell>
											<TableCell>
												{task.deadlineDate ? format(task.deadlineDate, "PPP") : "-"}
											</TableCell>
										</TableRow>
									))}
							</TableBody>
						</Table>
					</div>
				)}
			</div>
		</>
	);
};

export default Page;

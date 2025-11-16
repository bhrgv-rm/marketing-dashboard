"use client";

import Loading from "@/components/loading";
import React, { useEffect, useState } from "react";
import Empties from "@/components/empties";
import { FolderOpenIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

import dynamic from "next/dynamic";
const Plyr = dynamic(() => import("plyr-react"), {
	ssr: false,
	loading: () => <div className="text-center p-4">Loading video...</div>,
});
import "plyr-react/plyr.css";

import Link from "next/link";
import InfoTooltip from "@/components/info-tooltip";
import Chip from "@/components/chip";
import { useSession } from "@/context/SessionContext";
import Card from "@/components/card";

const Page = ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = React.use(params);

	const { user, token, loading: sessionLoading } = useSession();

	const [workspace, setWorkspace] = useState<any | null>(null);
	const [tasks, setTasks] = useState<any[]>([]);
	const [role, setRole] = useState<number>(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Wait until session is ready
		if (sessionLoading) return;
		if (!token) {
			setLoading(false);
			return;
		}

		const fetchTasks = async () => {
			try {
				const res = await fetch(`/api/ws/getTasks?workspaceId=${id}`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						sessionToken: token,
					},
				});

				if (!res.ok) {
					const text = await res.text();
					console.error("Bad response:", text);
					throw new Error(`Failed to fetch tasks: ${res.status}`);
				}

				const wsData = await res.json();
				setWorkspace(wsData.workspace || null);
				setTasks(wsData.tasks || []);

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
				console.error("Failed to fetch tasks:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchTasks();
	}, [id, token, sessionLoading]);

	// Still loading session or page data
	if (sessionLoading || loading) return <Loading />;

	return (
		<>
			<div className="max-w-5xl mx-auto mt-12 px-4">
				{/* Header + Create Button */}
				<div className="flex justify-between mb-4">
					<div className="flex justify-center items-center gap-2">
						<h1 className="text-2xl font-black">Tasks in {workspace?.name ?? "Workspace"}</h1>

						<InfoTooltip icon={<InformationCircleIcon className="size-6" />}>
							When a task has multiple uploaded files, swipe left or right to view them.
						</InfoTooltip>
					</div>
					{role !== 6 && (
						<Link
							href={`/ws/${id}/createTask`}
							className="px-4 py-2 rounded font-semibold transition duration-200 flex items-center justify-center gap-2 cursor-pointer h-fit bg-gray-100 text-gray-800 border shadow-inner">
							Create New Task
						</Link>
					)}
				</div>
				{/* Tasks List */}
				<div className="flex flex-wrap gap-0.5">
					{/* Empty */}
					{tasks.length === 0 && (
						<Empties
							title={`No tasks found in ${workspace?.name}.`}
							description="Please contact the administrator for further information."
							icon={<FolderOpenIcon className="size-12" />}
						/>
					)}

					{/* Task Cards */}
					{tasks.map((task) => (
						<div
							key={task.id}
							className="border w-[calc(50%-0.25rem)] border-foreground/10 rounded-lg p-4 shadow-sm bg-background relative">
							{/* Media Carousel */}
							{task.files && task.files.length > 0 && (
								<Carousel className="w-[450px] h-[250px] mx-auto">
									<CarouselContent>
										{task.files.map((file: any) => (
											<CarouselItem key={file.id} className="flex justify-center">
												<div className="w-[450px] h-[250px] rounded-2xl flex justify-center items-center">
													{file.type === "video" ? (
														<div className="rounded-lg overflow-hidden shadow-md">
															<Plyr
																source={{
																	type: "video",
																	sources: [{ src: file.url, type: "video/mp4" }],
																}}
																options={{
																	controls: [
																		"play-large",
																		"play",
																		"progress",
																		"current-time",
																		"mute",
																		"volume",
																		"settings",
																		"fullscreen",
																	],
																}}
															/>
														</div>
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
								</Carousel>
							)}

							{/* Task Info */}
							<div className="relative">
								<h3 className="font-semibold text-xl mt-3">{task.name}</h3>

								<div className="mt-2 flex flex-wrap gap-1">
									<Chip value={`${task.priority} priority`} />
									<Chip value={`Work: ${task.taskstatus}`} />
									<Chip value={`Client: ${task.clientStatus}`} />
								</div>

								{/* Full-card overlay link */}
								<Link href={`/tasks/${task.id}`} className="absolute inset-0 z-10" />
							</div>
						</div>
					))}
				</div>
			</div>
		</>
	);
};

export default Page;

"use client";

import React, { useState } from "react";
import Header from "./header";

interface Props {
	children: React.ReactNode;
}

export default function SidebarLayout({ children }: Props) {
	const [isOpen, setOpen] = useState(true);

	return (
		<div className="flex">
			<Header isOpen={isOpen} setOpen={setOpen} />
			<div className={`transition-all duration-300 flex-1 ${isOpen ? "ml-56" : "ml-20"}`}>
				{children}
			</div>
		</div>
	);
}

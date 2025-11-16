"use client";
import React, { useState, useRef, useEffect } from "react";

interface InfoTooltipProps {
	icon: React.ReactNode;
	children: React.ReactNode; // tooltip content
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ icon, children }) => {
	const [visible, setVisible] = useState(false);
	const [position, setPosition] = useState<"top" | "bottom">("top");
	const tooltipRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!visible || !triggerRef.current || !tooltipRef.current) return;

		const triggerRect = triggerRef.current.getBoundingClientRect();
		const tooltipRect = tooltipRef.current.getBoundingClientRect();
		const spaceBelow = window.innerHeight - triggerRect.bottom;

		// Flip tooltip if there's not enough space below
		if (spaceBelow < tooltipRect.height + 8) setPosition("top");
		else setPosition("bottom");
	}, [visible]);

	return (
		<div
			className="relative inline-block"
			onMouseEnter={() => setVisible(true)}
			onMouseLeave={() => setVisible(false)}
			ref={triggerRef}>
			<div className="cursor-pointer inline-flex items-center justify-center">{icon}</div>

			{visible && (
				<div
					ref={tooltipRef}
					className={`absolute z-50 w-64 p-2 rounded-md text-sm border-foreground border bg-card backdrop-blur-xs transition-all duration-200 shadow-lg ${
						position === "top"
							? "bottom-full mb-2 left-1/2 -translate-x-1/2"
							: "top-full mt-2 left-1/2 -translate-x-1/2"
					}`}>
					{children}
				</div>
			)}
		</div>
	);
};

export default InfoTooltip;

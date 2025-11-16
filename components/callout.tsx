import React from "react";

interface CalloutProps {
	icon?: React.ReactNode;
	children: React.ReactNode;
}
const Callout: React.FC<CalloutProps> = ({ icon, children }) => {
	return (
		<div className="flex gap-2 items-center border border-chart-1 text-chart-1 rounded border-l-4 pl-3 py-2">
			{icon}
			{children}
		</div>
	);
};

export default Callout;

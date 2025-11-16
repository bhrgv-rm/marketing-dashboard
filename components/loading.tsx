import React from "react";

interface LoadingProps {
	children?: React.ReactNode;
}
const Loading: React.FC<LoadingProps> = ({ children }) => {
	return (
		<div className="absolute inset-0 flex flex-col gap-2 items-center justify-center z-10 backdrop-blur-xs">
			<div
				className="inline-block size-10 animate-spin rounded-full border-3 border-solid border-current border-e-transparent dark:bg-white"
				role="status"
			/>
			{children}
		</div>
	);
};

export default Loading;

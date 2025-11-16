import React from "react";

interface EmptiesProps {
	icon: React.ReactNode;
	title: string;
	description?: string;
}
const Empties: React.FC<EmptiesProps> = ({ icon, title, description }) => {
	return (
		<div className="flex flex-col items-center mt-2 mx-auto justify-center px-20 py-4 pt-8 text-center border border-dashed rounded-lg bg-muted/50 w-fit min-w-180">
			{icon}
			<h1 className="text-2xl font-semibold tracking-tight mt-8">{title}</h1>
			<p className="font-medium mt-2">{description}</p>
		</div>
	);
};

export default Empties;

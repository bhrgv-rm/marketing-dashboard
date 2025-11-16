import Link from "next/link";
import React, { ReactNode } from "react";

interface CardProps {
	children?: ReactNode;
	image?: string;
	url?: string;
}

const Card: React.FC<CardProps> = ({ children, url, image }) => {
	return (
		<div className="relative border min-w-60 border-foreground w-fit rounded-xl overflow-hidden">
			<img src={image} alt="Incorrect Image URL" className="m-0.5 rounded-lg h-80 object-fill" />

			<div className="absolute bottom-0 left-0 right-0 bg-background m-1 rounded p-2">
				{children}
			</div>

			{url && <Link href={url} className="absolute inset-0 z-10" />}
		</div>
	);
};

export default Card;

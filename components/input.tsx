import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	className?: string; // custom tailwind classes
}

const Input: React.FC<InputProps> = ({ label, className = "", ...props }) => {
	return (
		<div className="flex flex-col space-y-1 w-full">
			{label && (
				<label htmlFor={props.id} className="text-sm font-medium">
					{label}
				</label>
			)}
			<input
				{...props}
				id={props.id}
				name={props.id}
				className={`pl-4 py-2 border-black border rounded ${className}`}
			/>
		</div>
	);
};

export default Input;

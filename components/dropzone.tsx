import { DocumentPlusIcon } from "@heroicons/react/24/outline";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

type Props = {
	onFilesSelected: (files: File[]) => void;
	disabled?: boolean;
};

export default function Dropzone({ onFilesSelected, disabled = false }: Props) {
	const [files, setFiles] = useState<File[]>([]);

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		const kb = bytes / 1024;
		if (kb < 1024) return `${kb.toFixed(2)} KB`;
		const mb = kb / 1024;
		return `${mb.toFixed(2)} MB`;
	}

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			setFiles(acceptedFiles);
			onFilesSelected(acceptedFiles);
		},
		[onFilesSelected]
	);

	const { getRootProps, getInputProps } = useDropzone({
		onDrop,
		disabled,
	});

	return (
		<section className="container">
			<div
				{...getRootProps({ className: "dropzone" })}
				className="container flex flex-col gap-2 py-4 mt-4 items-center justify-center border-dashed border">
				<input {...getInputProps()} />
				<DocumentPlusIcon className="size-10" />
				<p>Select files to be uploaded (Multiple files can also be selected)</p>
			</div>

			<aside className="mt-2">
				<h4>Selected Files - </h4>
				<ul>
					{files.map((file) => (
						<li key={file.name}>
							{file.name} — {formatFileSize(file.size)}
						</li>
					))}
				</ul>
			</aside>
		</section>
	);
}

import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";
const UserSelect = ({
	label,
	value,
	onSelect,
	options,
}: {
	label: string;
	value: string;
	onSelect: (v: string) => void;
	options: any[];
}) => (
	<div>
		<label className="text-sm font-semibold">{label}</label>
		<Select value={value} onValueChange={onSelect}>
			<SelectTrigger className="w-full mt-1">
				<SelectValue placeholder={loadingUsers ? "Loading..." : "Select People"} />
			</SelectTrigger>

			<SelectContent className="max-h-64">
				{options.map((u: any) => (
					<SelectItem key={u.id} value={u.id}>
						<div className="flex items-center gap-4">
							<img src={u.image} className="size-10 rounded-full border" alt="" />
							<div className="flex flex-col">
								<p className="font-bold">{u.name}</p>
								<p className="text-sm">{u.email}</p>
							</div>
						</div>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	</div>
);

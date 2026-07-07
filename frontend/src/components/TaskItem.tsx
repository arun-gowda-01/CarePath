interface TaskItemProps {
	completed: boolean;
	title: string;
	time: string;
	description?: string;
	priority?: "low" | "medium" | "high";
	type?:
		| "medication"
		| "exercise"
		| "check-in"
		| "appointment"
		| "wound-check"
		| "other";
	isOverdue?: boolean;
	onToggle?: () => void;
}

function TaskItem({
	completed,
	title,
	time,
	description,
	priority = "medium",
	type = "other",
	isOverdue = false,
	onToggle,
}: TaskItemProps) {
	return (
		<div
			className={`p-4 rounded-lg border transition-colors ${
				completed
					? "border-green-200 bg-green-50/50"
					: isOverdue
					? "border-red-200 bg-red-50/50"
					: "border-border bg-card"
			} ${onToggle ? "hover:border-primary/50 cursor-pointer" : ""}`}
			onClick={onToggle}
		>
			<div className="flex items-start gap-3">
				<div
					className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
						completed
							? "bg-primary border-primary"
							: "border-border"
					}`}
				>
					{completed && <span className="text-white text-sm">✓</span>}
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 flex-wrap mb-1">
						<p
							className={`font-semibold ${
								completed
									? "line-through text-muted-foreground"
									: "text-foreground"
							}`}
						>
							{title}
						</p>
						<span
							className={`px-2 py-0.5 rounded text-xs font-medium ${
								priority === "high"
									? "bg-red-100 text-red-800"
									: priority === "medium"
									? "bg-yellow-100 text-yellow-800"
									: "bg-blue-100 text-blue-800"
							}`}
						>
							{priority.toUpperCase()}
						</span>
						<span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground capitalize">
							{type.replace("-", " ")}
						</span>
					</div>
					{description && (
						<p className="text-sm text-muted-foreground mb-2">
							{description}
						</p>
					)}
					<div className="flex items-center gap-4 text-xs text-muted-foreground">
						<span>🕒 {time}</span>
						{completed && (
							<span className="text-green-600 font-medium">
								✓ Completed
							</span>
						)}
						{isOverdue && !completed && (
							<span className="text-red-600 font-medium">
								⚠ Overdue
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default TaskItem;

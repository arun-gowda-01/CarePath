import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { doctorApi } from "@/lib/api";
import type { Task, CreateTaskData } from "@/lib/types";

interface TaskManagementProps {
	patientId: string;
	tasks: Task[];
	onUpdate: () => void;
}

function TaskManagement({ patientId, tasks, onUpdate }: TaskManagementProps) {
	const [showTaskForm, setShowTaskForm] = useState(false);
	const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

	const [taskForm, setTaskForm] = useState<CreateTaskData>({
		patientId: patientId,
		title: "",
		description: "",
		type: "other",
		scheduledTime: new Date().toISOString().slice(0, 16),
		priority: "medium",
	});

	const handleCreateTask = async () => {
		try {
			if (!taskForm.title || !taskForm.scheduledTime) {
				alert("Please enter task title and scheduled time");
				return;
			}

			if (editingTaskId) {
				await doctorApi.updateTask(editingTaskId, taskForm);
			} else {
				await doctorApi.createTask(taskForm);
			}

			setShowTaskForm(false);
			setEditingTaskId(null);
			setTaskForm({
				patientId: patientId,
				title: "",
				description: "",
				type: "other",
				scheduledTime: new Date().toISOString().slice(0, 16),
				priority: "medium",
			});

			onUpdate();
		} catch (err: unknown) {
			console.error("Error saving task:", err);
			alert(
				(err as { response?: { data?: { message?: string } } }).response
					?.data?.message || "Failed to save task"
			);
		}
	};

	const handleEditTask = (task: Task) => {
		setEditingTaskId(task._id);
		setTaskForm({
			patientId: patientId,
			title: task.title,
			description: task.description || "",
			type: task.type,
			scheduledTime: new Date(task.scheduledTime)
				.toISOString()
				.slice(0, 16),
			priority: task.priority,
		});
		setShowTaskForm(true);
	};

	const handleDeleteTask = async (taskId: string) => {
		if (!confirm("Are you sure you want to delete this task?")) return;

		try {
			await doctorApi.deleteTask(taskId);
			onUpdate();
		} catch (err: unknown) {
			console.error("Error deleting task:", err);
			alert(
				(err as { response?: { data?: { message?: string } } }).response
					?.data?.message || "Failed to delete task"
			);
		}
	};

	return (
		<div className="space-y-4">
			<Card className="p-6 space-y-4">
				<div className="flex justify-between items-center">
					<h2 className="font-semibold text-lg text-foreground">
						Patient Tasks
					</h2>
					<Button
						size="sm"
						onClick={() => {
							setShowTaskForm(!showTaskForm);
							setEditingTaskId(null);
							setTaskForm({
								patientId: patientId,
								title: "",
								description: "",
								type: "other",
								scheduledTime: new Date()
									.toISOString()
									.slice(0, 16),
								priority: "medium",
							});
						}}
					>
						{showTaskForm ? "Cancel" : "Add Task"}
					</Button>
				</div>

				{/* Task Form */}
				{showTaskForm && (
					<Card className="p-4 bg-muted/30 space-y-4">
						<h3 className="font-medium text-foreground">
							{editingTaskId ? "Edit" : "New"} Task
						</h3>
						<div className="grid grid-cols-1 gap-4">
							<div>
								<Label htmlFor="title">Task Title *</Label>
								<Input
									id="title"
									value={taskForm.title}
									onChange={(e) =>
										setTaskForm({
											...taskForm,
											title: e.target.value,
										})
									}
									placeholder="e.g., Take morning walk"
								/>
							</div>

							<div>
								<Label htmlFor="description">
									Description (Optional)
								</Label>
								<Textarea
									id="description"
									value={taskForm.description}
									onChange={(e) =>
										setTaskForm({
											...taskForm,
											description: e.target.value,
										})
									}
									placeholder="Additional details about the task..."
									rows={3}
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label htmlFor="type">Task Type *</Label>
									<select
										id="type"
										value={taskForm.type}
										onChange={(e) =>
											setTaskForm({
												...taskForm,
												type: e.target.value as
													| "medication"
													| "check-in"
													| "appointment"
													| "wound-check"
													| "other",
											})
										}
										className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									>
										<option value="medication">
											Medication
										</option>
										<option value="exercise">
											Exercise
										</option>
										<option value="check-in">
											Check-in
										</option>
										<option value="appointment">
											Appointment
										</option>
										<option value="wound-check">
											Wound Check
										</option>
										<option value="other">Other</option>
									</select>
								</div>

								<div>
									<Label htmlFor="scheduledTime">
										Scheduled Date & Time *
									</Label>
									<Input
										id="scheduledTime"
										type="datetime-local"
										value={taskForm.scheduledTime}
										onChange={(e) =>
											setTaskForm({
												...taskForm,
												scheduledTime: e.target.value,
											})
										}
									/>
								</div>
							</div>

							<div className="space-y-3">
								<Label>Priority *</Label>
								<RadioGroup
									value={taskForm.priority}
									onValueChange={(
										value: "low" | "medium" | "high"
									) =>
										setTaskForm({
											...taskForm,
											priority: value,
										})
									}
								>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="low" id="low" />
										<Label
											htmlFor="low"
											className="font-normal cursor-pointer"
										>
											Low Priority
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem
											value="medium"
											id="medium"
										/>
										<Label
											htmlFor="medium"
											className="font-normal cursor-pointer"
										>
											Medium Priority
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem
											value="high"
											id="high"
										/>
										<Label
											htmlFor="high"
											className="font-normal cursor-pointer"
										>
											High Priority
										</Label>
									</div>
								</RadioGroup>
							</div>
						</div>
						<Button onClick={handleCreateTask}>
							{editingTaskId ? "Update" : "Add"} Task
						</Button>
					</Card>
				)}

				{/* Tasks List */}
				<div className="space-y-3">
					{tasks.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-8">
							No tasks added yet
						</p>
					) : (
						tasks
							.sort(
								(a, b) =>
									new Date(a.scheduledTime).getTime() -
									new Date(b.scheduledTime).getTime()
							)
							.map((task) => {
								const scheduledDate = new Date(
									task.scheduledTime
								);
								const isOverdue =
									!task.completed &&
									scheduledDate < new Date();

								return (
									<div
										key={task._id}
										className={`p-4 border rounded-lg ${
											task.completed
												? "border-green-200 bg-green-50/50"
												: isOverdue
												? "border-red-200 bg-red-50/50"
												: "border-border"
										}`}
									>
										<div className="flex justify-between items-start mb-2">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<p
														className={`font-semibold text-foreground ${
															task.completed
																? "line-through text-muted-foreground"
																: ""
														}`}
													>
														{task.title}
													</p>
													<span
														className={`px-2 py-0.5 rounded text-xs font-medium ${
															task.priority ===
															"high"
																? "bg-red-100 text-red-800"
																: task.priority ===
																  "medium"
																? "bg-yellow-100 text-yellow-800"
																: "bg-blue-100 text-blue-800"
														}`}
													>
														{task.priority.toUpperCase()}
													</span>
													<span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground capitalize">
														{task.type.replace(
															"-",
															" "
														)}
													</span>
												</div>
												{task.description && (
													<p className="text-sm text-muted-foreground mb-2">
														{task.description}
													</p>
												)}
												<div className="flex items-center gap-4 text-xs text-muted-foreground">
													<span>
														📅{" "}
														{scheduledDate.toLocaleDateString(
															"en-US",
															{
																weekday:
																	"short",
																month: "short",
																day: "numeric",
															}
														)}
													</span>
													<span>
														🕒{" "}
														{scheduledDate.toLocaleTimeString(
															"en-US",
															{
																hour: "numeric",
																minute: "2-digit",
															}
														)}
													</span>
													{task.completed && (
														<span className="text-green-600 font-medium">
															✓ Completed
														</span>
													)}
													{isOverdue && (
														<span className="text-red-600 font-medium">
															⚠ Overdue
														</span>
													)}
												</div>
											</div>
											<div className="flex gap-2">
												<Button
													size="sm"
													variant="outline"
													onClick={() =>
														handleEditTask(task)
													}
												>
													Edit
												</Button>
												<Button
													size="sm"
													variant="destructive"
													onClick={() =>
														handleDeleteTask(
															task._id
														)
													}
												>
													Delete
												</Button>
											</div>
										</div>
									</div>
								);
							})
					)}
				</div>
			</Card>
		</div>
	);
}

export default TaskManagement;

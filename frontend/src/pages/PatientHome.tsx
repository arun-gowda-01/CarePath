import { useEffect, useState } from "react";
import TaskItem from "@/components/TaskItem";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router";
import { patientApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Task } from "@/lib/types";
import { toast } from "sonner";

function PatientHome() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const [patientId, setPatientId] = useState<string | null>(null);
	const [userName, setUserName] = useState("Patient");
	const [daysPostOp, setDaysPostOp] = useState(0);
	const [monitoringDays, setMonitoringDays] = useState(7);

	useEffect(() => {
		const fetchData = async () => {
			if (!user?.id) return;

			try {
				setLoading(true);

				// Get patient details from analytics
				const analyticsRes = await patientApi.getAnalytics();
				const patient = analyticsRes.data.data?.patient;

				if (!patient?._id) {
					throw new Error("Could not find patient profile");
				}

				setPatientId(patient._id);
				setUserName(user.name?.split(" ")[0] || "Patient");
				setDaysPostOp(patient.daysPostOp || 0);
				setMonitoringDays(patient.monitoringDays || 7);

				// Fetch today's tasks (excluding medication type)
				const tasksRes = await patientApi.getTasks(patient._id);
				const allTasks = tasksRes.data.data || [];

				// Filter for today's tasks and exclude medication type
				const today = new Date();
				today.setHours(0, 0, 0, 0);

				const todayTasks = allTasks.filter((task: Task) => {
					const taskDate = new Date(task.scheduledTime);
					taskDate.setHours(0, 0, 0, 0);
					return (
						taskDate.getTime() === today.getTime() &&
						task.type !== "medication"
					);
				});

				setTasks(todayTasks);
			} catch (error: unknown) {
				console.error("Error fetching data:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [user]);

	const handleTaskToggle = async (taskId: string, completed: boolean) => {
		// Only allow marking as complete (not undoing)
		if (!completed) {
			toast.error("Completed tasks cannot be undone");
			return;
		}

		try {
			await patientApi.updateTask(taskId, { completed });
			setTasks((prev) =>
				prev.map((task) =>
					task._id === taskId ? { ...task, completed } : task
				)
			);
			toast.success("Task completed!");
		} catch (error: unknown) {
			console.error("Error updating task:", error);
			toast.error("Failed to update task");
		}
	};

	const completedToday = tasks.filter((t) => t.completed).length;
	const totalTasks = tasks.length;
	const progressPercent =
		monitoringDays > 0
			? Math.min((daysPostOp / monitoringDays) * 100, 100)
			: 0;

	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour < 12) return "Good Morning";
		if (hour < 18) return "Good Afternoon";
		return "Good Evening";
	};

	if (loading) {
		return (
			<div className="max-w-2xl mx-auto p-4 md:p-6">
				<h1 className="text-3xl font-bold text-foreground">
					Loading...
				</h1>
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
			{/* Header */}
			<div className="space-y-2">
				<h1 className="text-3xl font-bold text-foreground">
					{getGreeting()}, {userName}
				</h1>
				<p className="text-muted-foreground">
					Day {daysPostOp} Post-Op - You're doing great!
				</p>
			</div>

			{/* Progress Tracker */}
			<Card className="p-6 bg-linear-to-r from-primary/10 to-accent/10 border-primary/20">
				<div className="space-y-3">
					<div className="flex justify-between items-center">
						<h2 className="font-semibold text-foreground">
							Recovery Progress
						</h2>
						<span className="text-sm font-medium text-primary">
							{completedToday}/{totalTasks} tasks
						</span>
					</div>
					<div className="w-full bg-muted rounded-full h-3 overflow-hidden">
						<div
							className="bg-linear-to-r from-primary to-accent h-full transition-all duration-500"
							style={{ width: `${progressPercent}%` }}
						/>
					</div>
					<p className="text-sm text-muted-foreground">
						{monitoringDays > 0
							? `Day ${Math.min(
									daysPostOp,
									monitoringDays
								)} of ${monitoringDays}-day monitoring plan`
							: totalTasks === 0
							? "No tasks for today"
							: "You're on track for a smooth recovery"}
					</p>
				</div>
			</Card>

			{/* Motivational Banner */}
			<Card className="p-4 bg-accent/10 border-accent/20">
				<p className="text-sm text-foreground">
					<span className="font-semibold">💡 Tip:</span> Staying
					hydrated and following your medication schedule are key to
					faster recovery.
				</p>
			</Card>

			{/* Quick Action Buttons */}
			<div className="grid grid-cols-2 gap-4">
				<Button
					size="lg"
					className="h-24 flex flex-col items-center justify-center gap-2 text-base"
					onClick={() => navigate("/patient/checkin")}
				>
					<span className="text-2xl">📋</span>
					Symptom Check-in
				</Button>
				<Button
					size="lg"
					variant="outline"
					className="h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
					onClick={() => navigate("/patient/messages")}
				>
					<span className="text-2xl">💬</span>
					Messages
				</Button>
			</div>

			{/* Today's Tasks Preview */}
			<div className="space-y-3">
				<h2 className="font-semibold text-lg text-foreground">
					Today's Tasks
				</h2>
				{tasks.length === 0 ? (
					<Card className="p-6 text-center">
						<p className="text-muted-foreground">
							No tasks for today
						</p>
					</Card>
				) : (
					<div className="space-y-2">
						{tasks.slice(0, 5).map((task) => {
							const scheduledDate = new Date(task.scheduledTime);
							const isOverdue =
								!task.completed && scheduledDate < new Date();

							// Only allow toggle if task is not completed (PatientHome only shows today's tasks)
							const canToggle = !task.completed;

							return (
								<TaskItem
									key={task._id}
									completed={task.completed}
									title={task.title}
									description={task.description}
									priority={task.priority}
									type={task.type}
									isOverdue={isOverdue}
									time={scheduledDate.toLocaleTimeString(
										"en-US",
										{
											hour: "numeric",
											minute: "2-digit",
										}
									)}
									onToggle={
										canToggle
											? () =>
													handleTaskToggle(
														task._id,
														!task.completed
													)
											: undefined
									}
								/>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}

export default PatientHome;

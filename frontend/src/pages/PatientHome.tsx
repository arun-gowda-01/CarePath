import { useEffect, useState } from "react";
import TaskItem from "@/components/TaskItem";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router";
import { patientApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Task } from "@/lib/types";
import { toast } from "sonner";
import {
	CalendarDays,
	Clock,
	MapPin,
	Stethoscope,
} from "lucide-react";

interface FollowUpConsultation {
	_id: string;
	title: string;
	description?: string;
	scheduledTime: string;
	priority: "low" | "medium" | "high";
	location?: string;
	status: "scheduled" | "completed" | "cancelled";
	completedAt?: string;
	notes?: string;
	doctorId?: {
		_id?: string;
		userId?: {
			_id?: string;
			firstName?: string;
			lastName?: string;
		};
	};
}

function PatientHome() {
	const navigate = useNavigate();

	const { user } = useAuth();

	const [tasks, setTasks] =
		useState<Task[]>([]);

	const [followUps, setFollowUps] =
		useState<FollowUpConsultation[]>([]);

	const [loading, setLoading] =
		useState(true);

	const [userName, setUserName] =
		useState("Patient");

	const [daysPostOp, setDaysPostOp] =
		useState(0);

	const [monitoringDays, setMonitoringDays] =
		useState(7);

	// ------------------------------------------------------------
	// Fetch patient dashboard data
	// ------------------------------------------------------------

	useEffect(() => {
		const fetchData = async () => {
			if (!user?.id) {
				return;
			}

			try {
				setLoading(true);

				// ------------------------------------------------
				// Patient analytics / profile
				// ------------------------------------------------

				const analyticsRes =
					await patientApi.getAnalytics();

				const patient =
					analyticsRes.data.data?.patient;

				if (!patient?._id) {
					throw new Error(
						"Could not find patient profile"
					);
				}

				setUserName(
					user.name?.split(" ")[0] ||
						"Patient"
				);

				setDaysPostOp(
					patient.daysPostOp || 0
				);

				setMonitoringDays(
					patient.monitoringDays || 7
				);

				// ------------------------------------------------
				// Today's tasks
				// ------------------------------------------------

				const tasksRes =
					await patientApi.getTasks(
						patient._id
					);

				const allTasks =
					tasksRes.data.data || [];

				const today =
					new Date();

				today.setHours(
					0,
					0,
					0,
					0
				);

				const todayTasks =
					allTasks.filter(
						(task: Task) => {
							const taskDate =
								new Date(
									task.scheduledTime
								);

							taskDate.setHours(
								0,
								0,
								0,
								0
							);

							return (
								taskDate.getTime() ===
									today.getTime() &&
								task.type !==
									"medication"
							);
						}
					);

				setTasks(
					todayTasks
				);

				// ------------------------------------------------
				// Follow-up consultations
				// ------------------------------------------------

				try {
					const followUpRes =
						await patientApi.getMyFollowUpConsultations();

					const followUpData =
						followUpRes.data.data ||
						[];

					setFollowUps(
						followUpData
					);
				} catch (error) {
					console.error(
						"Error fetching follow-up consultations:",
						error
					);

					// Don't fail the whole dashboard
					setFollowUps([]);
				}
			} catch (error: unknown) {
				console.error(
					"Error fetching patient dashboard data:",
					error
				);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [user]);

	// ------------------------------------------------------------
	// Task completion
	// ------------------------------------------------------------

	const handleTaskToggle = async (
		taskId: string,
		completed: boolean
	) => {
		if (!completed) {
			toast.error(
				"Completed tasks cannot be undone"
			);
			return;
		}

		try {
			await patientApi.updateTask(
				taskId,
				{
					completed,
				}
			);

			setTasks((prev) =>
				prev.map((task) =>
					task._id === taskId
						? {
								...task,
								completed,
							}
						: task
				)
			);

			toast.success(
				"Task completed!"
			);
		} catch (error: unknown) {
			console.error(
				"Error updating task:",
				error
			);

			toast.error(
				"Failed to update task"
			);
		}
	};

	// ------------------------------------------------------------
	// Dashboard calculations
	// ------------------------------------------------------------

	const completedToday =
		tasks.filter(
			(task) => task.completed
		).length;

	const totalTasks =
		tasks.length;

	const progressPercent =
		monitoringDays > 0
			? Math.min(
					(daysPostOp /
						monitoringDays) *
						100,
					100
				)
			: 0;

	// ------------------------------------------------------------
	// Greeting
	// ------------------------------------------------------------

	const getGreeting = () => {
		const hour =
			new Date().getHours();

		if (hour < 12) {
			return "Good Morning";
		}

		if (hour < 18) {
			return "Good Afternoon";
		}

		return "Good Evening";
	};

	// ------------------------------------------------------------
	// Follow-up formatting
	// ------------------------------------------------------------

	const getDoctorName = (
		followUp: FollowUpConsultation
	) => {
		const firstName =
			followUp.doctorId?.userId
				?.firstName || "";

		const lastName =
			followUp.doctorId?.userId
				?.lastName || "";

		const fullName =
			`${firstName} ${lastName}`.trim();

		return fullName ||
			"Your doctor";
	};

	const getPriorityClass = (
		priority: FollowUpConsultation["priority"]
	) => {
		switch (priority) {
			case "high":
				return "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400";

			case "medium":
				return "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";

			case "low":
				return "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400";

			default:
				return "bg-muted text-muted-foreground";
		}
	};

	const formatDate = (
		date: string
	) => {
		return new Date(
			date
		).toLocaleDateString(
			"en-US",
			{
				weekday:
					"short",
				month:
					"short",
				day:
					"numeric",
				year:
					"numeric",
			}
		);
	};

	const formatTime = (
		date: string
	) => {
		return new Date(
			date
		).toLocaleTimeString(
			"en-US",
			{
				hour: "numeric",
				minute:
					"2-digit",
			}
		);
	};

	const upcomingFollowUps =
		followUps
			.filter(
				(followUp) =>
					followUp.status ===
					"scheduled"
			)
			.filter(
				(followUp) =>
					new Date(
						followUp.scheduledTime
					).getTime() >=
					Date.now()
			)
			.sort(
				(a, b) =>
					new Date(
						a.scheduledTime
					).getTime() -
					new Date(
						b.scheduledTime
					).getTime()
			)
			.slice(0, 3);

	// ------------------------------------------------------------
	// Loading
	// ------------------------------------------------------------

	if (loading) {
		return (
			<div className="mx-auto max-w-2xl p-4 md:p-6">
				<h1 className="text-3xl font-bold text-foreground">
					Loading...
				</h1>
			</div>
		);
	}

	// ------------------------------------------------------------
	// Page
	// ------------------------------------------------------------

	return (
		<div className="mx-auto max-w-2xl space-y-6 p-4 pb-24 md:p-6">
			{/* ====================================================
			    Header
			    ==================================================== */}

			<div className="space-y-2">
				<h1 className="text-3xl font-bold text-foreground">
					{getGreeting()},{" "}
					{userName}
				</h1>

				<p className="text-muted-foreground">
					Day {daysPostOp} Post-Op
					- You're doing great!
				</p>
			</div>

			{/* ====================================================
			    Recovery Progress
			    ==================================================== */}

			<Card className="border-primary/20 bg-linear-to-r from-primary/10 to-accent/10 p-6">
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h2 className="font-semibold text-foreground">
							Recovery Progress
						</h2>

						<span className="text-sm font-medium text-primary">
							{completedToday}/
							{totalTasks}{" "}
							tasks
						</span>
					</div>

					<div className="h-3 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full bg-linear-to-r from-primary to-accent transition-all duration-500"
							style={{
								width: `${progressPercent}%`,
							}}
						/>
					</div>

					<p className="text-sm text-muted-foreground">
						{monitoringDays >
						0
							? `Day ${Math.min(
									daysPostOp,
									monitoringDays
								)} of ${monitoringDays}-day monitoring plan`
							: totalTasks ===
							  0
							? "No tasks for today"
							: "You're on track for a smooth recovery"}
					</p>
				</div>
			</Card>

			{/* ====================================================
			    Motivational Banner
			    ==================================================== */}

			<Card className="border-accent/20 bg-accent/10 p-4">
				<p className="text-sm text-foreground">
					<span className="font-semibold">
						💡 Tip:
					</span>{" "}
					Staying hydrated
					and following your
					medication schedule
					are key to faster
					recovery.
				</p>
			</Card>

			{/* ====================================================
			    Quick Actions
			    ==================================================== */}

			<div className="grid grid-cols-2 gap-4">
				<Button
					size="lg"
					className="h-24 flex-col items-center justify-center gap-2 text-base"
					onClick={() =>
						navigate(
							"/patient/checkin"
						)
					}
				>
					<span className="text-2xl">
						📋
					</span>

					Symptom Check-in
				</Button>

				<Button
					size="lg"
					variant="outline"
					className="h-24 flex-col items-center justify-center gap-2 bg-transparent"
					onClick={() =>
						navigate(
							"/patient/messages"
						)
					}
				>
					<span className="text-2xl">
						💬
					</span>

					Messages
				</Button>
			</div>

			{/* ====================================================
			    Follow-up Visits
			    ==================================================== */}

			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold text-foreground">
						Upcoming Follow-up Visits
					</h2>

					{followUps.length >
						0 && (
						<span className="text-sm text-muted-foreground">
							{
								followUps.length
							}{" "}
							scheduled
						</span>
					)}
				</div>

				{upcomingFollowUps.length ===
				0 ? (
					<Card className="p-6 text-center">
						<CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

						<p className="font-medium text-foreground">
							No upcoming follow-up visits
						</p>

						<p className="mt-1 text-sm text-muted-foreground">
							Your doctor will
							schedule a follow-up
							if needed.
						</p>
					</Card>
				) : (
					<div className="space-y-3">
						{upcomingFollowUps.map(
							(
								followUp
							) => (
								<Card
									key={
										followUp._id
									}
									className="p-5"
								>
									<div className="space-y-4">
										{/* Title */}

										<div className="flex items-start justify-between gap-3">
											<div>
												<h3 className="font-semibold text-foreground">
													{
														followUp.title
													}
												</h3>

												<div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
													<Stethoscope className="h-4 w-4" />

													<span>
														{
															getDoctorName(
																followUp
															)
														}
													</span>
												</div>
											</div>

											<span
												className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getPriorityClass(
													followUp.priority
												)}`}
											>
												{
													followUp.priority
												}
											</span>
										</div>

										{/* Description */}

										{followUp.description && (
											<p className="text-sm text-muted-foreground">
												{
													followUp.description
												}
											</p>
										)}

										{/* Date and Time */}

										<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
											<div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
												<CalendarDays className="h-4 w-4 text-primary" />

												<div>
													<p className="text-xs text-muted-foreground">
														Date
													</p>

													<p className="text-sm font-medium text-foreground">
														{formatDate(
															followUp.scheduledTime
														)}
													</p>
												</div>
											</div>

											<div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
												<Clock className="h-4 w-4 text-primary" />

												<div>
													<p className="text-xs text-muted-foreground">
														Time
													</p>

													<p className="text-sm font-medium text-foreground">
														{formatTime(
															followUp.scheduledTime
														)}
													</p>
												</div>
											</div>
										</div>

										{/* Location */}

										{followUp.location && (
											<div className="flex items-start gap-2 text-sm">
												<MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

												<div>
													<p className="text-xs text-muted-foreground">
														Location
													</p>

													<p className="font-medium text-foreground">
														{
															followUp.location
														}
													</p>
												</div>
											</div>
										)}

										{/* Status */}

										<div className="border-t border-border pt-3">
											<span className="text-xs font-medium capitalize text-muted-foreground">
												Status:{" "}
												<span className="text-foreground">
													{
														followUp.status
													}
												</span>
											</span>
										</div>
									</div>
								</Card>
							)
						)}
					</div>
				)}

				{followUps.length >
					3 && (
					<Button
						variant="outline"
						className="w-full"
						onClick={() =>
							navigate(
								"/patient/reports"
							)
						}
					>
						View All Follow-up Visits
					</Button>
				)}
			</div>

			{/* ====================================================
			    Today's Tasks
			    ==================================================== */}

			<div className="space-y-3">
				<h2 className="text-lg font-semibold text-foreground">
					Today's Tasks
				</h2>

				{tasks.length ===
				0 ? (
					<Card className="p-6 text-center">
						<p className="text-muted-foreground">
							No tasks for today
						</p>
					</Card>
				) : (
					<div className="space-y-2">
						{tasks
							.slice(0, 5)
							.map(
								(task) => {
									const scheduledDate =
										new Date(
											task.scheduledTime
										);

									const isOverdue =
										!task.completed &&
										scheduledDate <
											new Date();

									const canToggle =
										!task.completed;

									return (
										<TaskItem
											key={
												task._id
											}
											completed={
												task.completed
											}
											title={
												task.title
											}
											description={
												task.description
											}
											priority={
												task.priority
											}
											type={
												task.type
											}
											isOverdue={
												isOverdue
											}
											time={scheduledDate.toLocaleTimeString(
												"en-US",
												{
													hour: "numeric",
													minute:
														"2-digit",
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
								}
							)}
					</div>
				)}
			</div>
		</div>
	);
}

export default PatientHome;
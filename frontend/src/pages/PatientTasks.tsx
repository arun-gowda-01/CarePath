import { useEffect, useState } from "react";
import TaskItem from "@/components/TaskItem";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { patientApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Task, Medication, ExerciseTask } from "@/lib/types";
import { toast } from "sonner";
import axios from "axios";
import type { ExerciseDBExercise } from "@/lib/types";

function PatientTasks() {
	const { user, loading: authLoading } = useAuth();
	const [tasks, setTasks] = useState<Task[]>([]);
	const [medications, setMedications] = useState<Medication[]>([]);
	const [exercises, setExercises] = useState<ExerciseTask[]>([]);
	const [loading, setLoading] = useState(true);
	const [patientId, setPatientId] = useState<string | null>(null);
	const [exerciseDetails, setExerciseDetails] = useState<
		Map<string, ExerciseDBExercise>
	>(new Map());
	const [loadingDetails, setLoadingDetails] = useState<Set<string>>(
		new Set()
	);

	// Fetch exercise details from ExerciseDB API
	const fetchExerciseDetails = async (exerciseDbId: string) => {
		if (exerciseDetails.has(exerciseDbId)) return;

		setLoadingDetails((prev) => new Set(prev).add(exerciseDbId));

		try {
			const { data } = await axios.get(
				`https://www.exercisedb.dev/api/v1/exercises/${exerciseDbId}`
			);
			setExerciseDetails((prev) =>
				new Map(prev).set(exerciseDbId, data.data)
			);
		} catch (err) {
			console.error(
				`Error fetching exercise details for ${exerciseDbId}:`,
				err
			);
		} finally {
			setLoadingDetails((prev) => {
				const newSet = new Set(prev);
				newSet.delete(exerciseDbId);
				return newSet;
			});
		}
	};

	// Fetch exercise details for all assigned exercises
	useEffect(() => {
		exercises.forEach((exerciseTask) => {
			if (exerciseTask.exerciseId?.exerciseDbId) {
				fetchExerciseDetails(exerciseTask.exerciseId.exerciseDbId);
			}
		});
	}, [exercises]);

	useEffect(() => {
		const fetchData = async () => {
			if (authLoading || !user) return;

			try {
				setLoading(true);

				const analyticsRes = await patientApi.getAnalytics();

				const fetchedPatientId = analyticsRes.data.data?.patient?._id;

				if (!fetchedPatientId) {
					throw new Error("Could not find patient profile");
				}

				setPatientId(fetchedPatientId);

				const tasksRes = await patientApi.getTasks(fetchedPatientId);
				const allTasks = tasksRes.data.data || [];
				// Filter out exercises - they are fetched separately
				setTasks(
					allTasks.filter(
						(task: Task) =>
							task.type !== "medication" &&
							task.type !== "exercise"
					)
				);

				const medsRes = await patientApi.getMyMedications();
				setMedications(medsRes.data.data || []);

				const exercisesRes = await patientApi.getExercises(
					fetchedPatientId
				);
				setExercises(exercisesRes.data.data || []);
			} catch (error) {
				console.error("Error fetching data:", error);
				const err = error as {
					response?: { data?: { message?: string } };
				};
				toast.error(
					err.response?.data?.message ||
						"Failed to load tasks and medications"
				);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [user, authLoading]);

	const handleTaskToggle = async (taskId: string, completed: boolean) => {
		if (!patientId) return;

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

	const handleDoseTaken = async (medicationId: string, timeOfDay: string) => {
		try {
			await patientApi.markDoseAsTaken(medicationId, timeOfDay);

			// Refresh medications to update UI
			const medsRes = await patientApi.getMyMedications();
			setMedications(medsRes.data.data || []);

			toast.success(
				`${
					timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)
				} dose marked as taken`
			);
		} catch (error: unknown) {
			console.error("Error marking dose:", error);
			const err = error as { response?: { data?: { message?: string } } };
			toast.error(
				err.response?.data?.message || "Failed to mark dose as taken"
			);
		}
	};

	// Group tasks by date
	const groupTasksByDate = () => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const groups: { date: string; items: Task[] }[] = [];
		const todayTasks = tasks.filter((task) => {
			const taskDate = new Date(task.scheduledTime);
			taskDate.setHours(0, 0, 0, 0);
			return taskDate.getTime() === today.getTime();
		});

		const tomorrowTasks = tasks.filter((task) => {
			const taskDate = new Date(task.scheduledTime);
			taskDate.setHours(0, 0, 0, 0);
			return taskDate.getTime() === tomorrow.getTime();
		});

		if (todayTasks.length > 0)
			groups.push({ date: "Today", items: todayTasks });
		if (tomorrowTasks.length > 0)
			groups.push({ date: "Tomorrow", items: tomorrowTasks });

		return groups;
	};

	if (loading) {
		return (
			<div className="w-full p-4 md:p-6">
				<h1 className="text-3xl font-semibold text-foreground">
					Loading...
				</h1>
			</div>
		);
	}

	const taskGroups = groupTasksByDate();

	return (
		<div className="w-full p-4 md:p-6 gap-4 flex h-[calc(100vh-5rem)] overflow-hidden">
			<div className="w-[50%]">
				<h1 className="text-3xl font-semibold text-foreground">
					My Tasks
				</h1>

				{taskGroups.length === 0 ? (
					<Card className="p-6 text-center mt-4">
						<p className="text-muted-foreground">
							No tasks scheduled
						</p>
					</Card>
				) : (
					taskGroups.map((group) => (
						<div key={group.date} className="space-y-3 mt-4">
							<h2 className="font-semibold text-lg text-primary">
								{group.date}
							</h2>
							<div className="space-y-2">
								{group.items.map((task) => {
									const scheduledDate = new Date(
										task.scheduledTime
									);
									const isOverdue =
										!task.completed &&
										scheduledDate < new Date();

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
											onToggle={() =>
												handleTaskToggle(
													task._id,
													!task.completed
												)
											}
										/>
									);
								})}
							</div>
						</div>
					))
				)}
			</div>

			{/* TODO : sent sms / email reminder */}
			<div className="flex-1 h-full overflow-y-auto space-y-8 pr-4">
				<div className="space-y-3 mt-8">
					<h2 className="font-semibold text-3xl text-foreground">
						Medications
					</h2>
					<p className="text-sm text-muted-foreground">
						Your current prescriptions and schedules
					</p>
					{medications.length === 0 ? (
						<Card className="p-6 text-center">
							<p className="text-muted-foreground">
								No active medications
							</p>
						</Card>
					) : (
						<Card className="p-4 space-y-3">
							{medications.map((med) => (
								<MedicationItem
									key={med._id}
									medication={med}
									onDoseTaken={handleDoseTaken}
								/>
							))}
						</Card>
					)}
				</div>
				<div className="space-y-3 mt-8">
					<h2 className="font-semibold text-3xl text-foreground">
						Exercise Demonstrations
					</h2>
					<p className="text-sm text-muted-foreground">
						Follow these step-by-step instructions for your physical
						therapy
					</p>
					{exercises.length === 0 ? (
						<Card className="p-6 text-center">
							<p className="text-muted-foreground">
								No exercises assigned yet. Your doctor will
								assign exercises as part of your recovery plan.
							</p>
						</Card>
					) : (
						<Card className="p-4 space-y-4">
							{exercises.map((exerciseTask) => {
								const exercise = exerciseTask.exerciseId;
								if (!exercise) return null;

								const dbExercise = exercise.exerciseDbId
									? exerciseDetails.get(exercise.exerciseDbId)
									: null;
								const isLoading = exercise.exerciseDbId
									? loadingDetails.has(exercise.exerciseDbId)
									: false;

								return (
									<ExerciseDemo
										key={exerciseTask._id}
										title={exercise.name}
										gifUrl={dbExercise?.gifUrl}
										targetAreas={
											dbExercise?.targetMuscles?.join(
												", "
											) || ""
										}
										equipment={dbExercise?.equipment}
										instructions={dbExercise?.instructions}
										completed={exerciseTask.completed}
										isLoading={isLoading}
										onComplete={() =>
											handleTaskToggle(
												exerciseTask._id,
												true
											)
										}
									/>
								);
							})}
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}

// Medication Item Component
interface MedicationItemProps {
	medication: Medication;
	onDoseTaken: (medicationId: string, timeOfDay: string) => void;
}

function MedicationItem({ medication, onDoseTaken }: MedicationItemProps) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Check which doses have been taken today
	const getDoseStatus = (timeOfDay: string) => {
		return medication.dosesTaken.some((dose) => {
			const doseDate = new Date(dose.date);
			doseDate.setHours(0, 0, 0, 0);
			return (
				doseDate.getTime() === today.getTime() &&
				dose.timeOfDay === timeOfDay
			);
		});
	};

	const foodRelationText = {
		before: "before food",
		after: "after food",
		with: "with food",
		empty_stomach: "on empty stomach",
	};

	// Get scheduled hour for each time of day
	const getScheduledHour = (timeOfDay: string): number => {
		const timeMap = {
			morning: 8,
			afternoon: 14,
			night: 20,
		};
		return timeMap[timeOfDay as keyof typeof timeMap];
	};

	// Check if current time has passed the scheduled time for a dose
	const isDoseTimeReached = (timeOfDay: string): boolean => {
		const now = new Date();
		const scheduledHour = getScheduledHour(timeOfDay);
		return now.getHours() >= scheduledHour;
	};

	// Get next untaken dose that is due now
	const getNextAvailableDose = () => {
		for (const timing of medication.timings) {
			const isTaken = getDoseStatus(timing.timeOfDay);
			const isTimeReached = isDoseTimeReached(timing.timeOfDay);

			if (!isTaken && isTimeReached) {
				return timing.timeOfDay;
			}
		}
		return null;
	};

	// Get next untaken dose for display
	const getNextDose = () => {
		for (const timing of medication.timings) {
			if (!getDoseStatus(timing.timeOfDay)) {
				const timeMap = {
					morning: "08:00 AM",
					afternoon: "02:00 PM",
					night: "08:00 PM",
				};
				return `${timing.timeOfDay} - ${timeMap[timing.timeOfDay]}`;
			}
		}
		return "All doses taken today";
	};

	const nextAvailableDose = getNextAvailableDose();
	const isButtonDisabled = nextAvailableDose === null;

	return (
		<div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
			<div className="flex-1">
				<p className="font-medium text-foreground">{medication.name}</p>
				<p className="text-sm text-muted-foreground">
					{medication.timings.length}{" "}
					{medication.timings.length === 1 ? "time" : "times"} daily •{" "}
					{foodRelationText[medication.foodRelation]}
				</p>
				<p className="text-xs text-muted-foreground mt-1">
					Next due: {getNextDose()}
				</p>
			</div>
			<Button
				size="sm"
				variant="outline"
				disabled={isButtonDisabled}
				onClick={() => {
					if (nextAvailableDose) {
						onDoseTaken(medication._id, nextAvailableDose);
					}
				}}
			>
				{isButtonDisabled ? "Not Yet Due" : "Taken"}
			</Button>
		</div>
	);
}

interface ExerciseDemoProps {
	title: string;
	gifUrl?: string;
	targetAreas?: string;
	equipment?: string;
	instructions?: string[];
	completed?: boolean;
	isLoading?: boolean;
	onComplete?: () => void;
}

function ExerciseDemo({
	title,
	gifUrl,
	targetAreas,
	equipment,
	instructions,
	isLoading,
}: ExerciseDemoProps) {
	return (
		<Card className="p-4">
			<div className="space-y-4">
				<div>
					<h3 className="font-semibold text-lg text-foreground capitalize mb-2">
						{title}
					</h3>
					{isLoading ? (
						<p className="text-sm text-muted-foreground">
							Loading details...
						</p>
					) : (
						<>
							{targetAreas && (
								<p className="text-sm text-muted-foreground">
									Target: {targetAreas}
								</p>
							)}
							{equipment && (
								<p className="text-sm text-muted-foreground mt-1">
									Equipment: {equipment}
								</p>
							)}
						</>
					)}
				</div>

				{isLoading ? (
					<div className="flex justify-center">
						<div className="w-full max-w-md h-64 bg-muted animate-pulse rounded-lg" />
					</div>
				) : (
					<>
						{gifUrl && (
							<div className="flex justify-center">
								<img
									src={gifUrl}
									alt={title}
									className="w-full max-w-md h-50 object-contain rounded-lg border"
								/>
							</div>
						)}

						{instructions && instructions.length > 0 && (
							<div>
								<h4 className="font-medium text-base mb-3">
									Instructions:
								</h4>
								<ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
									{instructions.map((inst, idx) => (
										<li key={idx} className="pl-2">
											{inst}
										</li>
									))}
								</ol>
							</div>
						)}
					</>
				)}
			</div>
		</Card>
	);
}

export default PatientTasks;

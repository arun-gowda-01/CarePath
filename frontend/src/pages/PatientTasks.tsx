import { useEffect, useState } from "react";
import TaskItem from "@/components/TaskItem";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { patientApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type {
	Task,
	Medication,
	ExerciseTask,
} from "@/lib/types";
import { toast } from "sonner";

// ============================================================
// MongoDB populated exercise structure
// ============================================================

interface PopulatedExercise {
	_id: string;
	exerciseDbId: string;
	name: string;
	gifUrl: string;
	bodyParts: string[];
	equipments: string[];
	targetMuscles: string[];
	secondaryMuscles: string[];
	instructions: string[];
	createdAt?: string;
	updatedAt?: string;
}

interface PopulatedExerciseTask
	extends Omit<ExerciseTask, "exerciseId"> {
	exerciseId:
		| PopulatedExercise
		| null;
}

// ============================================================
// Patient Tasks
// ============================================================

function PatientTasks() {
	const {
		user,
		loading: authLoading,
	} = useAuth();

	const [tasks, setTasks] =
		useState<Task[]>([]);

	const [medications, setMedications] =
		useState<Medication[]>([]);

	const [exercises, setExercises] =
		useState<PopulatedExerciseTask[]>([]);

	const [loading, setLoading] =
		useState(true);

	const [patientId, setPatientId] =
		useState<string | null>(null);

	// ------------------------------------------------------------
	// Fetch all patient data
	// ------------------------------------------------------------

	const fetchData = async () => {
		if (
			authLoading ||
			!user
		) {
			return;
		}

		try {
			setLoading(true);

			// ----------------------------------------------------
			// Get patient ID
			// ----------------------------------------------------

			const analyticsRes =
				await patientApi.getAnalytics();

			const fetchedPatientId =
				analyticsRes.data.data
					?.patient?._id;

			if (!fetchedPatientId) {
				throw new Error(
					"Could not find patient profile"
				);
			}

			setPatientId(
				fetchedPatientId
			);

			// ----------------------------------------------------
			// Get regular tasks
			// ----------------------------------------------------

			const tasksRes =
				await patientApi.getTasks(
					fetchedPatientId
				);

			const allTasks =
				tasksRes.data.data || [];

			setTasks(
				allTasks.filter(
					(task: Task) =>
						task.type !==
							"medication" &&
						task.type !==
							"exercise"
				)
			);

			// ----------------------------------------------------
			// Get medications
			// ----------------------------------------------------

			const medsRes =
				await patientApi.getMyMedications();

			setMedications(
				medsRes.data.data || []
			);

			// ----------------------------------------------------
			// Get exercises
			//
			// The backend populates exerciseId, so we now use:
			//
			// exerciseId.gifUrl
			// exerciseId.targetMuscles
			// exerciseId.equipments
			// exerciseId.instructions
			//
			// No external ExerciseDB request is needed.
			// ----------------------------------------------------

			const exercisesRes =
				await patientApi.getExercises(
					fetchedPatientId
				);

			const allExercises =
				(exercisesRes.data.data ||
					[]) as PopulatedExerciseTask[];

			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const tomorrow = new Date(today);
			tomorrow.setDate(tomorrow.getDate() + 1);

			const todaysExercises =
				allExercises.filter((exerciseTask) => {
					const scheduledDate = new Date(
						exerciseTask.scheduledTime
					);

					return (
						scheduledDate >= today &&
						scheduledDate < tomorrow
					);
				});

			setExercises(todaysExercises);
		} catch (error) {
			console.error(
				"Error fetching patient task data:",
				error
			);

			const err = error as {
				response?: {
					data?: {
						message?: string;
					};
				};
			};

			toast.error(
				err.response?.data
					?.message ||
					"Failed to load tasks and medications"
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [
		user,
		authLoading,
	]);

	// ------------------------------------------------------------
	// Complete regular task
	// ------------------------------------------------------------

	const handleTaskToggle = async (
		taskId: string,
		completed: boolean
	) => {
		if (!patientId) {
			return;
		}

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
					completed: true,
				}
			);

			setTasks((prev) =>
				prev.map((task) =>
					task._id === taskId
						? {
								...task,
								completed:
									true,
							}
						: task
				)
			);

			toast.success(
				"Task completed!"
			);
		} catch (error) {
			console.error(
				"Error completing task:",
				error
			);

			toast.error(
				"Failed to complete task"
			);
		}
	};

	// ------------------------------------------------------------
	// Complete exercise
	// ------------------------------------------------------------

	const handleExerciseComplete =
		async (
			taskId: string
		) => {
			if (!patientId) {
				return;
			}

			try {
				await patientApi.completeExercise(
					taskId,
					{
						completed: true,
					}
				);

				// Reload from backend.
				// The backend creates tomorrow's
				// occurrence for daily recurring exercises.
				const exercisesRes =
					await patientApi.getExercises(
						patientId
					);

				const allExercises =
					(exercisesRes.data.data ||
						[]) as PopulatedExerciseTask[];

				const today = new Date();
				today.setHours(0, 0, 0, 0);

				const tomorrow = new Date(today);
				tomorrow.setDate(tomorrow.getDate() + 1);

				const todaysExercises =
					allExercises.filter((exerciseTask) => {
						const scheduledDate = new Date(
							exerciseTask.scheduledTime
						);

						return (
							scheduledDate >= today &&
							scheduledDate < tomorrow
						);
					});

				setExercises(todaysExercises);

				toast.success(
					"Exercise completed!"
				);
			} catch (error) {
				console.error(
					"Error completing exercise:",
					error
				);

				const err = error as {
					response?: {
						data?: {
							message?: string;
						};
					};
				};

				toast.error(
					err.response?.data
						?.message ||
						"Failed to complete exercise"
				);
			}
		};

	// ------------------------------------------------------------
	// Medication dose
	// ------------------------------------------------------------

	const handleDoseTaken = async (
		medicationId: string,
		timeOfDay: string
	) => {
		try {
			await patientApi.markDoseAsTaken(
				medicationId,
				timeOfDay
			);

			const medsRes =
				await patientApi.getMyMedications();

			setMedications(
				medsRes.data.data || []
			);

			toast.success(
				`${
					timeOfDay
						.charAt(0)
						.toUpperCase() +
					timeOfDay.slice(1)
				} dose marked as taken`
			);
		} catch (error) {
			console.error(
				"Error marking dose:",
				error
			);

			const err = error as {
				response?: {
					data?: {
						message?: string;
					};
				};
			};

			toast.error(
				err.response?.data
					?.message ||
					"Failed to mark dose as taken"
			);
		}
	};

	// ------------------------------------------------------------
	// Group regular tasks by date
	// ------------------------------------------------------------

	const groupTasksByDate = () => {
		const today =
			new Date();

		today.setHours(
			0,
			0,
			0,
			0
		);

		const tomorrow =
			new Date(today);

		tomorrow.setDate(
			tomorrow.getDate() +
				1
		);

		const groups: {
			date: string;
			items: Task[];
		}[] = [];

		const todayTasks =
			tasks.filter((task) => {
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
					today.getTime()
				);
			});

		const tomorrowTasks =
			tasks.filter((task) => {
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
					tomorrow.getTime()
				);
			});

		if (
			todayTasks.length >
			0
		) {
			groups.push({
				date: "Today",
				items: todayTasks,
			});
		}

		if (
			tomorrowTasks.length >
			0
		) {
			groups.push({
				date: "Tomorrow",
				items: tomorrowTasks,
			});
		}

		return groups;
	};

	// ------------------------------------------------------------
	// Loading
	// ------------------------------------------------------------

	if (loading) {
		return (
			<div className="w-full p-4 md:p-6">
				<h1 className="text-3xl font-semibold text-foreground">
					Loading...
				</h1>
			</div>
		);
	}

	const taskGroups =
		groupTasksByDate();

	// ------------------------------------------------------------
	// Render
	// ------------------------------------------------------------

	return (
		<div className="w-full p-4 md:p-6 gap-4 flex h-[calc(100vh-5rem)] overflow-hidden">
			{/* ====================================================
			    LEFT: TASKS
			    ==================================================== */}

			<div className="w-[50%]">
				<h1 className="text-3xl font-semibold text-foreground">
					My Tasks
				</h1>

				{taskGroups.length ===
				0 ? (
					<Card className="p-6 text-center mt-4">
						<p className="text-muted-foreground">
							No tasks scheduled
						</p>
					</Card>
				) : (
					taskGroups.map(
						(group) => (
							<div
								key={
									group.date
								}
								className="space-y-3 mt-4"
							>
								<h2 className="font-semibold text-lg text-primary">
									{
										group.date
									}
								</h2>

								<div className="space-y-2">
									{group.items.map(
										(
											task
										) => {
											const scheduledDate =
												new Date(
													task.scheduledTime
												);

											const isOverdue =
												!task.completed &&
												scheduledDate <
													new Date();

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
													onToggle={() =>
														handleTaskToggle(
															task._id,
															!task.completed
														)
													}
												/>
											);
										}
									)}
								</div>
							</div>
						)
					)
				)}
			</div>

			{/* ====================================================
			    RIGHT SIDE
			    ==================================================== */}

			<div className="flex-1 h-full overflow-y-auto space-y-8 pr-4">
				{/* =================================================
				    MEDICATIONS
				    ================================================= */}

				<div className="space-y-3 mt-8">
					<h2 className="font-semibold text-3xl text-foreground">
						Medications
					</h2>

					<p className="text-sm text-muted-foreground">
						Your current prescriptions and schedules
					</p>

					{medications.length ===
					0 ? (
						<Card className="p-6 text-center">
							<p className="text-muted-foreground">
								No active medications
							</p>
						</Card>
					) : (
						<Card className="p-4 space-y-3">
							{medications.map(
								(
									med
								) => (
									<MedicationItem
										key={
											med._id
										}
										medication={
											med
										}
										onDoseTaken={
											handleDoseTaken
										}
									/>
								)
							)}
						</Card>
					)}
				</div>

				{/* =================================================
				    EXERCISE DEMONSTRATIONS
				    ================================================= */}

				<div className="space-y-3 mt-8">
					<h2 className="font-semibold text-3xl text-foreground">
						Exercise Demonstrations
					</h2>

					<p className="text-sm text-muted-foreground">
						Complete your assigned exercises every day
					</p>

					{exercises.length ===
					0 ? (
						<Card className="p-6 text-center">
							<p className="text-muted-foreground">
								No exercises assigned yet.
								Your doctor will assign exercises
								as part of your recovery plan.
							</p>
						</Card>
					) : (
						<Card className="p-4 space-y-4">
							{exercises.map(
								(
									exerciseTask
								) => {
									const exercise =
										exerciseTask.exerciseId;

									if (
										!exercise
									) {
										return null;
									}

									return (
										<ExerciseDemo
											key={
												exerciseTask._id
											}
											title={
												exercise.name
											}
											gifUrl={
												exercise.gifUrl
											}
											targetAreas={
												exercise.targetMuscles?.join(
													", "
												) ||
												""
											}
											equipment={
												exercise.equipments?.join(
													", "
												) ||
												""
											}
											instructions={
												exercise.instructions
											}
											completed={
												exerciseTask.completed
											}
											onComplete={() =>
												handleExerciseComplete(
													exerciseTask._id
												)
											}
										/>
									);
								}
							)}
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}

// ================================================================
// Medication Item
// ================================================================

interface MedicationItemProps {
	medication: Medication;
	onDoseTaken: (
		medicationId: string,
		timeOfDay: string
	) => void;
}

function MedicationItem({
	medication,
	onDoseTaken,
}: MedicationItemProps) {
	const today =
		new Date();

	today.setHours(
		0,
		0,
		0,
		0
	);

	const getDoseStatus = (
		timeOfDay: string
	) => {
		return medication.dosesTaken.some(
			(dose) => {
				const doseDate =
					new Date(
						dose.date
					);

				doseDate.setHours(
					0,
					0,
					0,
					0
				);

				return (
					doseDate.getTime() ===
						today.getTime() &&
					dose.timeOfDay ===
						timeOfDay
				);
			}
		);
	};

	const foodRelationText = {
		before: "before food",
		after: "after food",
		with: "with food",
		empty_stomach:
			"on empty stomach",
	};

	const getScheduledHour = (
		timeOfDay: string
	): number => {
		const timeMap = {
			morning: 8,
			afternoon: 14,
			night: 20,
		};

		return timeMap[
			timeOfDay as keyof typeof timeMap
		];
	};

	const isDoseTimeReached = (
		timeOfDay: string
	): boolean => {
		const now =
			new Date();

		const scheduledHour =
			getScheduledHour(
				timeOfDay
			);

		return (
			now.getHours() >=
			scheduledHour
		);
	};

	const getNextAvailableDose =
		() => {
			for (const timing of medication.timings) {
				const isTaken =
					getDoseStatus(
						timing.timeOfDay
					);

				const isTimeReached =
					isDoseTimeReached(
						timing.timeOfDay
					);

				if (
					!isTaken &&
					isTimeReached
				) {
					return timing.timeOfDay;
				}
			}

			return null;
		};

	const getNextDose = () => {
		for (const timing of medication.timings) {
			if (
				!getDoseStatus(
					timing.timeOfDay
				)
			) {
				const timeMap = {
					morning:
						"08:00 AM",
					afternoon:
						"02:00 PM",
					night:
						"08:00 PM",
				};

				return `${timing.timeOfDay} - ${timeMap[timing.timeOfDay]}`;
			}
		}

		return "All doses taken today";
	};

	const nextAvailableDose =
		getNextAvailableDose();

	const isButtonDisabled =
		nextAvailableDose === null;

	return (
		<div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
			<div className="flex-1">
				<p className="font-medium text-foreground">
					{medication.name}
				</p>

				<p className="text-sm text-muted-foreground">
					{
						medication.timings
							.length
					}{" "}
					{medication.timings
						.length ===
					1
						? "time"
						: "times"}{" "}
					daily •{" "}
					{
						foodRelationText[
							medication
								.foodRelation
						]
					}
				</p>

				<p className="text-xs text-muted-foreground mt-1">
					Next due:{" "}
					{getNextDose()}
				</p>
			</div>

			<Button
				size="sm"
				variant="outline"
				disabled={
					isButtonDisabled
				}
				onClick={() => {
					if (
						nextAvailableDose
					) {
						onDoseTaken(
							medication._id,
							nextAvailableDose
						);
					}
				}}
			>
				{isButtonDisabled
					? "Not Yet Due"
					: "Taken"}
			</Button>
		</div>
	);
}

// ================================================================
// Exercise Demo
// ================================================================

interface ExerciseDemoProps {
	title: string;
	gifUrl?: string;
	targetAreas?: string;
	equipment?: string;
	instructions?: string[];
	completed?: boolean;
	onComplete?: () => void;
}

function ExerciseDemo({
	title,
	gifUrl,
	targetAreas,
	equipment,
	instructions,
	completed,
	onComplete,
}: ExerciseDemoProps) {
	return (
		<Card className="p-4">
			<div className="space-y-4">
				{/* Title */}

				<div className="flex items-start justify-between gap-3">
					<div>
						<h3 className="font-semibold text-xl text-foreground capitalize">
							{title}
						</h3>

						{targetAreas && (
							<p className="text-sm text-muted-foreground mt-2">
								Target:{" "}
								{
									targetAreas
								}
							</p>
						)}

						{equipment && (
							<p className="text-sm text-muted-foreground mt-1">
								Equipment:{" "}
								{
									equipment
								}
							</p>
						)}
					</div>

					<span
						className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
							completed
								? "bg-green-100 text-green-700"
								: "bg-primary/10 text-primary"
						}`}
					>
						{completed
							? "Completed Today"
							: "Today's Exercise"}
					</span>
				</div>

				{/* GIF */}

				{gifUrl ? (
					<div className="flex justify-center">
						<img
							src={
								gifUrl
							}
							alt={
								title
							}
							className="w-full max-w-md h-64 object-contain rounded-lg border bg-background"
						/>
					</div>
				) : (
					<div className="w-full max-w-md h-64 mx-auto rounded-lg border flex items-center justify-center bg-muted/30">
						<p className="text-sm text-muted-foreground">
							Exercise demonstration unavailable
						</p>
					</div>
				)}

				{/* Instructions */}

				{instructions &&
					instructions.length >
						0 && (
						<div>
							<h4 className="font-medium text-base mb-3">
								Instructions:
							</h4>

							<ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
								{instructions.map(
									(
										instruction,
										index
									) => (
										<li
											key={
												index
											}
											className="pl-2"
										>
											{
												instruction
											}
										</li>
									)
								)}
							</ol>
						</div>
					)}

				{/* Completion */}

				<Button
					className="w-full"
					disabled={
						!!completed
					}
					onClick={
						onComplete
					}
				>
					{completed
						? "Completed Today"
						: "Mark Exercise Complete"}
				</Button>
			</div>
		</Card>
	);
}

export default PatientTasks;
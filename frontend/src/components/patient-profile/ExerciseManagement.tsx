import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { doctorApi } from "@/lib/api";
import type {
	ExerciseDBExercise,
	AssignExerciseData,
	ExerciseTask,
} from "@/lib/types";
import axios from "axios";

interface ExerciseManagementProps {
	patientId: string;
	exercises: ExerciseTask[];
	onUpdate: () => void;
}

function ExerciseManagement({
	patientId,
	exercises,
	onUpdate,
}: ExerciseManagementProps) {
	const [bodyParts, setBodyParts] = useState<string[]>([]);
	const [searchResults, setSearchResults] = useState<ExerciseDBExercise[]>(
		[]
	);
	const [selectedBodyPart, setSelectedBodyPart] = useState<string>("");
	const [searchingExercises, setSearchingExercises] = useState(false);
	const [showExerciseForm, setShowExerciseForm] = useState(false);
	const [assigningExercise, setAssigningExercise] = useState(false);
	const [loadingBodyParts, setLoadingBodyParts] = useState(false);
	const [exerciseDetails, setExerciseDetails] = useState<
		Map<string, ExerciseDBExercise>
	>(new Map());
	const [loadingDetails, setLoadingDetails] = useState<Set<string>>(
		new Set()
	);

	const fetchBodyParts = async () => {
		try {
			setLoadingBodyParts(true);
			const { data } = await doctorApi.getBodyParts();
			setBodyParts(data.data || []);
		} catch (err: unknown) {
			console.error("Error fetching body parts:", err);
			// Fallback to a basic list if API fails
			setBodyParts([
				"abs",
				"biceps",
				"calves",
				"chest",
				"forearms",
				"glutes",
				"hamstrings",
				"lats",
				"quads",
				"shoulders",
				"traps",
				"triceps",
			]);
		} finally {
			setLoadingBodyParts(false);
		}
	};

	useEffect(() => {
		fetchBodyParts();
	}, []);

	const handleSearchExercises = async () => {
		if (!selectedBodyPart) {
			alert("Please select a muscle group first");
			return;
		}

		try {
			setSearchingExercises(true);

			const response = await doctorApi.searchExercises(selectedBodyPart);

			console.log(response);
			setSearchResults(response.data.data || []);
		} catch (err: unknown) {
			console.error("Error searching exercises:", err);
			alert(
				(err as { response?: { data?: { message?: string } } }).response
					?.data?.message ||
					"Failed to search exercises. Check if ExerciseDB API key is configured."
			);
		} finally {
			setSearchingExercises(false);
		}
	};

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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [exercises]);

	const handleAssignExercise = async (exercise: ExerciseDBExercise) => {
		try {
			setAssigningExercise(true);

			const data: AssignExerciseData = {
				patientId: patientId,
				exerciseData: exercise,
				scheduledTime: new Date().toISOString().slice(0, 16),
				sets: 3,
				repetitions: "10-15",
				priority: "medium",
			};

			await doctorApi.assignExercise(data);

			// Clear selected body part and search results
			setSelectedBodyPart("");
			setSearchResults([]);

			onUpdate();
		} catch (err: unknown) {
			console.error("Error assigning exercise:", err);
			alert(
				(err as { response?: { data?: { message?: string } } }).response
					?.data?.message || "Failed to assign exercise"
			);
		} finally {
			setAssigningExercise(false);
		}
	};

	const handleDeleteExercise = async (taskId: string) => {
		if (!confirm("Are you sure you want to remove this exercise?")) return;

		try {
			await doctorApi.deleteExercise(taskId);
			onUpdate();
		} catch (err: unknown) {
			console.error("Error deleting exercise:", err);
			alert(
				(err as { response?: { data?: { message?: string } } }).response
					?.data?.message || "Failed to delete exercise"
			);
		}
	};

	return (
		<div className="space-y-4">
			<Card className="p-6 space-y-6">
				{/* Header */}
				<div className="flex justify-between items-center">
					<h2 className="font-semibold text-lg text-foreground">
						Exercise Management
					</h2>
					<Button
						size="sm"
						onClick={() => {
							setShowExerciseForm(!showExerciseForm);
							setSearchResults([]);
							setSelectedBodyPart("");
						}}
					>
						{showExerciseForm ? "Hide Search" : "Add Exercise"}
					</Button>
				</div>

				{/* Exercise Search Form */}
				{showExerciseForm && (
					<Card className="p-4 bg-muted/30 space-y-4">
						<h3 className="font-medium text-foreground">
							Search ExerciseDB by Muscle Group
						</h3>

						<div>
							<Label htmlFor="bodyPart">
								Select Body Part / Muscle Group *
							</Label>
							<select
								id="bodyPart"
								className="w-full p-2 border rounded-md"
								value={selectedBodyPart}
								onChange={(e) =>
									setSelectedBodyPart(e.target.value)
								}
								disabled={loadingBodyParts}
							>
								<option value="">
									{loadingBodyParts
										? "Loading muscles..."
										: "Select muscle group..."}
								</option>
								{bodyParts.map((part) => (
									<option key={part} value={part}>
										{part.charAt(0).toUpperCase() +
											part.slice(1)}
									</option>
								))}
							</select>
						</div>

						<Button
							onClick={handleSearchExercises}
							disabled={
								searchingExercises ||
								!selectedBodyPart ||
								loadingBodyParts
							}
							className="w-full"
						>
							{searchingExercises
								? "Searching..."
								: "Search Exercises"}
						</Button>

						{/* Search Results */}
						{searchResults.length > 0 && (
							<div className="space-y-4 max-h-96 overflow-y-auto">
								<h4 className="font-medium text-foreground">
									Search Results ({searchResults.length}) -
									Click to assign
								</h4>
								<div className="grid grid-cols-1 gap-3">
									{searchResults.map((exercise) => (
										<Card
											key={exercise.exerciseId}
											className="p-4 cursor-pointer transition-all hover:border-primary hover:shadow-md"
											onClick={() =>
												handleAssignExercise(exercise)
											}
										>
											<div className="flex gap-4">
												<img
													src={exercise.gifUrl}
													alt={exercise.name}
													className="w-24 h-24 object-cover rounded"
												/>
												<div className="flex-1">
													<h5 className="font-semibold capitalize">
														{exercise.name}
													</h5>
													<div className="text-sm text-muted-foreground space-y-1 mt-2">
														<p>
															<strong>
																Target:
															</strong>{" "}
															{exercise.targetMuscles.map(
																(muscle) => (
																	<span
																		key={
																			muscle
																		}
																	>
																		{muscle}{" "}
																	</span>
																)
															)}
														</p>
														<p>
															<strong>
																Body Part:
															</strong>{" "}
															{exercise.bodyParts.map(
																(part) => (
																	<span
																		key={
																			part
																		}
																	>
																		{part}{" "}
																	</span>
																)
															)}
														</p>
													</div>
												</div>
											</div>
										</Card>
									))}
								</div>
								{assigningExercise && (
									<div className="text-center text-sm text-muted-foreground">
										Assigning exercise...
									</div>
								)}
							</div>
						)}
					</Card>
				)}

				{/* Assigned Exercises List */}
				<div className="space-y-3">
					<h3 className="font-medium text-foreground">
						Assigned Exercises ({exercises.length})
					</h3>

					{exercises.length === 0 ? (
						<Card className="p-4 text-center text-muted-foreground">
							No exercises assigned yet. Use the "Add Exercise"
							button to search and assign exercises.
						</Card>
					) : (
						exercises.map((exerciseTask) => {
							const exercise = exerciseTask.exerciseId;
							if (!exercise) return null;

							const dbExercise = exercise.exerciseDbId
								? exerciseDetails.get(exercise.exerciseDbId)
								: null;
							const isLoading = exercise.exerciseDbId
								? loadingDetails.has(exercise.exerciseDbId)
								: false;

							return (
								<Card key={exerciseTask._id} className="p-4">
									<div className="flex gap-4">
										{isLoading ? (
											<div className="w-20 h-20 bg-muted animate-pulse rounded" />
										) : dbExercise?.gifUrl ? (
											<img
												src={dbExercise.gifUrl}
												alt={exercise.name}
												className="w-20 h-20 object-cover rounded"
											/>
										) : (
											<div className="w-20 h-20 bg-muted flex items-center justify-center rounded text-xs text-muted-foreground">
												No Image
											</div>
										)}
										<div className="flex-1">
											<div className="flex justify-between items-start">
												<div>
													<h4 className="font-semibold capitalize">
														{exercise.name}
													</h4>
													<p className="text-sm text-muted-foreground">
														{
															exerciseTask.description
														}
													</p>
													{isLoading ? (
														<div className="text-xs text-muted-foreground mt-2">
															Loading exercise
															details...
														</div>
													) : (
														<div className="flex gap-4 text-xs text-muted-foreground mt-2">
															{dbExercise && (
																<>
																	<span>
																		🎯{" "}
																		{dbExercise.targetMuscles.join(
																			", "
																		)}
																	</span>
																	<span>
																		🏋️{" "}
																		{dbExercise.equipment ||
																			"bodyweight"}
																	</span>
																</>
															)}
															<span
																className={`px-2 py-0.5 rounded ${
																	exerciseTask.priority ===
																	"high"
																		? "bg-red-100 text-red-700"
																		: exerciseTask.priority ===
																		  "medium"
																		? "bg-yellow-100 text-yellow-700"
																		: "bg-gray-100 text-gray-700"
																}`}
															>
																{
																	exerciseTask.priority
																}
															</span>
														</div>
													)}
												</div>
												<Button
													size="sm"
													variant="destructive"
													onClick={() =>
														handleDeleteExercise(
															exerciseTask._id
														)
													}
												>
													Remove
												</Button>
											</div>
										</div>
									</div>
								</Card>
							);
						})
					)}
				</div>
			</Card>
		</div>
	);
}

export default ExerciseManagement;

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

interface RecurringExerciseData {
	enabled: boolean;
	frequency: "daily";
}

function ExerciseManagement({
	patientId,
	exercises,
	onUpdate,
}: ExerciseManagementProps) {
	const [bodyParts, setBodyParts] =
		useState<string[]>([]);

	const [searchResults, setSearchResults] =
		useState<ExerciseDBExercise[]>([]);

	const [selectedBodyPart, setSelectedBodyPart] =
		useState("");

	const [searchingExercises, setSearchingExercises] =
		useState(false);

	const [showExerciseForm, setShowExerciseForm] =
		useState(false);

	const [assigningExercise, setAssigningExercise] =
		useState(false);

	const [loadingBodyParts, setLoadingBodyParts] =
		useState(false);

	const [exerciseDetails, setExerciseDetails] =
		useState<Map<string, ExerciseDBExercise>>(
			new Map()
		);

	const [loadingDetails, setLoadingDetails] =
		useState<Set<string>>(new Set());

	// Daily recurrence is enabled by default.
	const [repeatDaily, setRepeatDaily] =
		useState(true);

	// ------------------------------------------------------------
	// Fetch body parts
	// ------------------------------------------------------------

	const fetchBodyParts = async () => {
		try {
			setLoadingBodyParts(true);

			const response =
				await doctorApi.getBodyParts();

			setBodyParts(
				response.data.data || []
			);
		} catch (error: unknown) {
			console.error(
				"Error fetching body parts:",
				error
			);

			setBodyParts([
				"back",
				"cardio",
				"chest",
				"lower arms",
				"lower legs",
				"neck",
				"shoulders",
				"upper arms",
				"upper legs",
				"waist",
			]);
		} finally {
			setLoadingBodyParts(false);
		}
	};

	useEffect(() => {
		fetchBodyParts();
	}, []);

	// ------------------------------------------------------------
	// Search exercises
	// ------------------------------------------------------------

	const handleSearchExercises = async () => {
		if (!selectedBodyPart) {
			alert(
				"Please select a muscle group first"
			);
			return;
		}

		try {
			setSearchingExercises(true);

			const response =
				await doctorApi.searchExercises(
					selectedBodyPart
				);

			setSearchResults(
				response.data.data || []
			);
		} catch (error: unknown) {
			console.error(
				"Error searching exercises:",
				error
			);

			const message =
				(
					error as {
						response?: {
							data?: {
								message?: string;
							};
						};
					}
				).response?.data?.message ||
				"Failed to search exercises";

			alert(message);
		} finally {
			setSearchingExercises(false);
		}
	};

	// ------------------------------------------------------------
	// Fetch exercise details
	// ------------------------------------------------------------

	const fetchExerciseDetails = async (
		exerciseDbId: string
	) => {
		if (
			exerciseDetails.has(
				exerciseDbId
			)
		) {
			return;
		}

		setLoadingDetails(
			(prev) => {
				const next = new Set(prev);
				next.add(exerciseDbId);
				return next;
			}
		);

		try {
			const response =
				await axios.get(
					`https://oss.exercisedb.dev/api/v1/exercises/${exerciseDbId}`
				);

			setExerciseDetails(
				(prev) => {
					const next = new Map(
						prev
					);

					next.set(
						exerciseDbId,
						response.data.data
					);

					return next;
				}
			);
		} catch (error: unknown) {
			console.error(
				`Error fetching exercise details for ${exerciseDbId}:`,
				error
			);
		} finally {
			setLoadingDetails(
				(prev) => {
					const next = new Set(
						prev
					);

					next.delete(
						exerciseDbId
					);

					return next;
				}
			);
		}
	};

	useEffect(() => {
		exercises.forEach(
			(exerciseTask) => {
				const exercise =
					exerciseTask.exerciseId;

				if (
					exercise?.exerciseDbId
				) {
					fetchExerciseDetails(
						exercise.exerciseDbId
					);
				}
			}
		);
	}, [exercises]);

	// ------------------------------------------------------------
	// Assign exercise
	// ------------------------------------------------------------

	const handleAssignExercise = async (
		exercise: ExerciseDBExercise
	) => {
		try {
			setAssigningExercise(true);

			const recurring: RecurringExerciseData =
				{
					enabled:
						repeatDaily,
					frequency:
						"daily",
				};

			const data: AssignExerciseData & {
				recurring: RecurringExerciseData;
			} = {
				patientId,
				exerciseData: exercise,
				scheduledTime:
					new Date()
						.toISOString()
						.slice(0, 16),
				sets: 3,
				repetitions: "10-15",
				priority: "medium",
				recurring,
			};

			await doctorApi.assignExercise(
				data
			);

			setSelectedBodyPart("");
			setSearchResults([]);
			setShowExerciseForm(false);
			setRepeatDaily(true);

			onUpdate();
		} catch (error: unknown) {
			console.error(
				"Error assigning exercise:",
				error
			);

			const message =
				(
					error as {
						response?: {
							data?: {
								message?: string;
							};
						};
					}
				).response?.data?.message ||
				"Failed to assign exercise";

			alert(message);
		} finally {
			setAssigningExercise(false);
		}
	};

	// ------------------------------------------------------------
	// Delete exercise
	// ------------------------------------------------------------

	const handleDeleteExercise = async (
		taskId: string
	) => {
		if (
			!confirm(
				"Are you sure you want to remove this exercise?"
			)
		) {
			return;
		}

		try {
			await doctorApi.deleteExercise(
				taskId
			);

			onUpdate();
		} catch (error: unknown) {
			console.error(
				"Error deleting exercise:",
				error
			);

			const message =
				(
					error as {
						response?: {
							data?: {
								message?: string;
							};
						};
					}
				).response?.data?.message ||
				"Failed to delete exercise";

			alert(message);
		}
	};

	// ------------------------------------------------------------
	// Render
	// ------------------------------------------------------------

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
							setShowExerciseForm(
								(prev) =>
									!prev
							);

							setSelectedBodyPart(
								""
							);

							setSearchResults(
								[]
							);

							setRepeatDaily(
								true
							);
						}}
					>
						{showExerciseForm
							? "Hide Search"
							: "Add Exercise"}
					</Button>
				</div>

				{/* ==================================================
				    Exercise Search Form
				    ================================================== */}

				{showExerciseForm && (
					<Card className="p-4 bg-muted/30 space-y-4">
						<h3 className="font-medium text-foreground">
							Search ExerciseDB by Muscle Group
						</h3>

						{/* Body Part */}

						<div>
							<Label htmlFor="bodyPart">
								Select Body Part / Muscle Group *
							</Label>

							<select
								id="bodyPart"
								className="w-full p-2 border rounded-md"
								value={
									selectedBodyPart
								}
								onChange={(
									event
								) =>
									setSelectedBodyPart(
										event
											.target
											.value
									)
								}
								disabled={
									loadingBodyParts
								}
							>
								<option value="">
									{loadingBodyParts
										? "Loading muscles..."
										: "Select muscle group..."}
								</option>

								{bodyParts.map(
									(
										part
									) => (
										<option
											key={
												part
											}
											value={
												part
											}
										>
											{part
												.charAt(
													0
												)
												.toUpperCase() +
												part.slice(
													1
												)}
										</option>
									)
								)}
							</select>
						</div>

						{/* Daily Recurrence */}

						<div className="rounded-lg border bg-background p-4">
							<div className="flex items-start gap-3">
								<input
									id="repeatDaily"
									type="checkbox"
									checked={
										repeatDaily
									}
									onChange={(
										event
									) =>
										setRepeatDaily(
											event
												.target
												.checked
										)
									}
									className="mt-1 h-4 w-4"
								/>

								<div>
									<Label
										htmlFor="repeatDaily"
										className="font-medium cursor-pointer"
									>
										Repeat this exercise daily
									</Label>

									<p className="text-xs text-muted-foreground mt-1">
										The exercise will be assigned again each day after the patient completes it.
									</p>
								</div>
							</div>
						</div>

						{/* Search */}

						<Button
							onClick={
								handleSearchExercises
							}
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

						{searchResults.length >
							0 && (
							<div className="space-y-4 max-h-96 overflow-y-auto">
								<h4 className="font-medium text-foreground">
									Search Results (
									{
										searchResults.length
									}
									) - Click to assign
								</h4>

								<div className="grid grid-cols-1 gap-3">
									{searchResults.map(
										(
											exercise
										) => (
											<Card
												key={
													exercise.exerciseId
												}
												className="p-4 cursor-pointer transition-all hover:border-primary hover:shadow-md"
												onClick={() =>
													handleAssignExercise(
														exercise
													)
												}
											>
												<div className="flex gap-4">
													<img
														src={
															exercise.gifUrl
														}
														alt={
															exercise.name
														}
														className="w-24 h-24 object-cover rounded"
													/>

													<div className="flex-1">
														<h5 className="font-semibold capitalize">
															{
																exercise.name
															}
														</h5>

														<div className="text-sm text-muted-foreground space-y-1 mt-2">
															<p>
																<strong>
																	Target:
																</strong>{" "}
																{exercise.targetMuscles.join(
																	", "
																)}
															</p>

															<p>
																<strong>
																	Body Part:
																</strong>{" "}
																{exercise.bodyParts.join(
																	", "
																)}
															</p>

															<p>
																<strong>
																	Equipment:
																</strong>{" "}
																{exercise.equipment ||
																	"bodyweight"}
															</p>
														</div>

														<p className="text-xs text-primary mt-3">
															{repeatDaily
																? "Will repeat daily"
																: "One-time exercise"}
														</p>
													</div>
												</div>
											</Card>
										)
									)}
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

				{/* ==================================================
				    Assigned Exercises
				    ================================================== */}

				<div className="space-y-3">
					<h3 className="font-medium text-foreground">
						Assigned Exercises (
						{exercises.length})
					</h3>

					{exercises.length ===
					0 ? (
						<Card className="p-4 text-center text-muted-foreground">
							No exercises assigned yet. Use the
							"Add Exercise" button to search and
							assign exercises.
						</Card>
					) : (
						exercises.map(
							(
								exerciseTask
							) => {
								const exercise =
									exerciseTask.exerciseId;

								if (!exercise) {
									return null;
								}

								const dbExercise =
									exercise.exerciseDbId
										? exerciseDetails.get(
												exercise.exerciseDbId
											)
										: undefined;

								const isLoading =
									exercise.exerciseDbId
										? loadingDetails.has(
												exercise.exerciseDbId
											)
										: false;

								return (
									<Card
										key={
											exerciseTask._id
										}
										className="p-4"
									>
										<div className="flex gap-4">
											{/* Image */}

											{isLoading ? (
												<div className="w-20 h-20 bg-muted animate-pulse rounded" />
											) : dbExercise?.gifUrl ? (
												<img
													src={
														dbExercise.gifUrl
													}
													alt={
														exercise.name
													}
													className="w-20 h-20 object-cover rounded"
												/>
											) : (
												<div className="w-20 h-20 bg-muted flex items-center justify-center rounded text-xs text-muted-foreground">
													No Image
												</div>
											)}

											{/* Details */}

											<div className="flex-1">
												<div className="flex justify-between items-start gap-4">
													<div>
														<h4 className="font-semibold capitalize">
															{
																exercise.name
															}
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
															<div className="flex gap-4 text-xs text-muted-foreground mt-2 flex-wrap">
																{dbExercise && (
																	<>
																		<span>
																			🎯{" "}
																			{dbExercise.targetMuscles.length >
																			0
																				? dbExercise.targetMuscles.join(
																						", "
																					)
																				: "N/A"}
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

																{exerciseTask.recurring?.enabled ? (
																	<span className="px-2 py-0.5 rounded bg-green-100 text-green-700">
																		Daily
																	</span>
																) : (
																	<span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
																		One-time
																	</span>
																)}
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
							}
						)
					)}
				</div>
			</Card>
		</div>
	);
}

export default ExerciseManagement;
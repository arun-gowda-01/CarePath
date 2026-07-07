import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { medicationApi } from "@/lib/api";
import type { Medication, CreateMedicationData } from "@/lib/types";

interface MedicationManagementProps {
	patientId: string;
	medications: Medication[];
	onUpdate: () => void;
}

function MedicationManagement({
	patientId,
	medications,
	onUpdate,
}: MedicationManagementProps) {
	const [showMedicationForm, setShowMedicationForm] = useState(false);
	const [editingMedicationId, setEditingMedicationId] = useState<
		string | null
	>(null);

	const [medicationForm, setMedicationForm] = useState<CreateMedicationData>({
		patientId: patientId,
		name: "",
		timings: [],
		foodRelation: "after",
		startDate: new Date().toISOString().split("T")[0],
		endDate: "",
		instructions: "",
		sideEffects: [],
	});

	const handleCreateMedication = async () => {
		try {
			if (
				!medicationForm.name ||
				!medicationForm.timings.length ||
				!medicationForm.startDate
			) {
				alert("Please enter medication name, timings, and start date");
				return;
			}

			if (editingMedicationId) {
				await medicationApi.updateMedication(
					editingMedicationId,
					medicationForm
				);
			} else {
				await medicationApi.createMedication(medicationForm);
			}

			setShowMedicationForm(false);
			setEditingMedicationId(null);
			setMedicationForm({
				patientId: patientId,
				name: "",
				timings: [],
				foodRelation: "after",
				startDate: new Date().toISOString().split("T")[0],
				endDate: "",
				instructions: "",
				sideEffects: [],
			});

			onUpdate();
		} catch (err: unknown) {
			console.error("Error saving medication:", err);
			alert(
				(err as { response?: { data?: { message?: string } } }).response
					?.data?.message || "Failed to save medication"
			);
		}
	};

	const handleEditMedication = (med: Medication) => {
		setEditingMedicationId(med._id);
		setMedicationForm({
			patientId: patientId,
			name: med.name,
			timings: med.timings,
			foodRelation: med.foodRelation,
			startDate: new Date(med.startDate).toISOString().split("T")[0],
			endDate: med.endDate
				? new Date(med.endDate).toISOString().split("T")[0]
				: "",
			instructions: med.instructions || "",
			sideEffects: med.sideEffects || [],
		});
		setShowMedicationForm(true);
	};

	const handleDeleteMedication = async (medicationId: string) => {
		if (!confirm("Are you sure you want to delete this medication?"))
			return;

		try {
			await medicationApi.deleteMedication(medicationId);
			onUpdate();
		} catch (err: unknown) {
			console.error("Error deleting medication:", err);
			alert(
				(err as { response?: { data?: { message?: string } } }).response
					?.data?.message || "Failed to delete medication"
			);
		}
	};

	const calculateTrackingDuration = (med: Medication): string => {
		const start = new Date(med.startDate);
		const end = med.endDate ? new Date(med.endDate) : new Date();

		const diffDays = Math.ceil(
			Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
		);

		return med.endDate
			? `${diffDays} days (completed)`
			: `${diffDays} days (ongoing)`;
	};

	return (
		<div className="space-y-4">
			<Card className="p-6 space-y-4">
				<div className="flex justify-between items-center">
					<h2 className="font-semibold text-lg text-foreground">
						Current Medications
					</h2>
					<Button
						size="sm"
						onClick={() => {
							setShowMedicationForm(!showMedicationForm);
							setEditingMedicationId(null);
							setMedicationForm({
								patientId: patientId,
								name: "",
								timings: [],
								foodRelation: "after",
								startDate: new Date()
									.toISOString()
									.split("T")[0],
								endDate: "",
								instructions: "",
								sideEffects: [],
							});
						}}
					>
						{showMedicationForm ? "Cancel" : "Add Medication"}
					</Button>
				</div>

				{/* Medication Form */}
				{showMedicationForm && (
					<Card className="p-4 bg-muted/30 space-y-4">
						<h3 className="font-medium text-foreground">
							{editingMedicationId ? "Edit" : "New"} Medication
						</h3>
						<div className="grid grid-cols-1 gap-4">
							<div>
								<Label htmlFor="name">
									Medication Name (include dosage) *
								</Label>
								<Input
									id="name"
									value={medicationForm.name}
									onChange={(e) =>
										setMedicationForm({
											...medicationForm,
											name: e.target.value,
										})
									}
									placeholder="e.g., Ibuprofen 400mg"
								/>
								<p className="text-xs text-muted-foreground mt-1">
									Include the dosage in the name (e.g.,
									"Aspirin 500mg", "Metformin 2 tablets")
								</p>
							</div>

							<div className="space-y-3">
								<Label>Timing (select all that apply) *</Label>
								<div className="flex flex-col space-y-2">
									{(
										[
											"morning",
											"afternoon",
											"night",
										] as const
									).map((time) => (
										<div
											key={time}
											className="flex items-center space-x-2"
										>
											<Checkbox
												id={time}
												checked={medicationForm.timings.some(
													(t) => t.timeOfDay === time
												)}
												onCheckedChange={(checked) => {
													if (checked) {
														setMedicationForm({
															...medicationForm,
															timings: [
																...medicationForm.timings,
																{
																	timeOfDay:
																		time,
																},
															],
														});
													} else {
														setMedicationForm({
															...medicationForm,
															timings:
																medicationForm.timings.filter(
																	(t) =>
																		t.timeOfDay !==
																		time
																),
														});
													}
												}}
											/>
											<label
												htmlFor={time}
												className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
											>
												{time}
											</label>
										</div>
									))}
								</div>
							</div>

							<div className="space-y-3">
								<Label>Food Relation *</Label>
								<RadioGroup
									value={medicationForm.foodRelation}
									onValueChange={(
										value:
											| "before"
											| "after"
											| "with"
											| "empty_stomach"
									) =>
										setMedicationForm({
											...medicationForm,
											foodRelation: value,
										})
									}
								>
									<div className="flex items-center space-x-2">
										<RadioGroupItem
											value="before"
											id="before"
										/>
										<Label
											htmlFor="before"
											className="font-normal cursor-pointer"
										>
											Before food
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem
											value="after"
											id="after"
										/>
										<Label
											htmlFor="after"
											className="font-normal cursor-pointer"
										>
											After food
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem
											value="with"
											id="with"
										/>
										<Label
											htmlFor="with"
											className="font-normal cursor-pointer"
										>
											With food
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem
											value="empty_stomach"
											id="empty_stomach"
										/>
										<Label
											htmlFor="empty_stomach"
											className="font-normal cursor-pointer"
										>
											On empty stomach
										</Label>
									</div>
								</RadioGroup>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label htmlFor="startDate">
										Start Date *
									</Label>
									<Input
										id="startDate"
										type="date"
										value={medicationForm.startDate}
										onChange={(e) =>
											setMedicationForm({
												...medicationForm,
												startDate: e.target.value,
											})
										}
									/>
								</div>
								<div>
									<Label htmlFor="endDate">
										End Date (Optional)
									</Label>
									<Input
										id="endDate"
										type="date"
										value={medicationForm.endDate}
										onChange={(e) =>
											setMedicationForm({
												...medicationForm,
												endDate: e.target.value,
											})
										}
									/>
								</div>
							</div>
						</div>
						<div>
							<Label htmlFor="instructions">
								Additional Instructions
							</Label>
							<Textarea
								id="instructions"
								value={medicationForm.instructions}
								onChange={(
									e: React.ChangeEvent<HTMLTextAreaElement>
								) =>
									setMedicationForm({
										...medicationForm,
										instructions: e.target.value,
									})
								}
								placeholder="Any additional instructions..."
								rows={3}
							/>
						</div>
						<Button onClick={handleCreateMedication}>
							{editingMedicationId ? "Update" : "Add"} Medication
						</Button>
					</Card>
				)}

				{/* Medications List */}
				<div className="space-y-3">
					{medications.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-8">
							No medications added yet
						</p>
					) : (
						medications.map((med) => (
							<div
								key={med._id}
								className="p-4 border border-border rounded-lg"
							>
								<div className="flex justify-between items-start mb-2">
									<div className="flex-1">
										<p className="font-semibold text-foreground">
											{med.name}
										</p>
										<p className="text-sm text-muted-foreground">
											{med.timings
												.map((t) => t.timeOfDay)
												.join(", ")}{" "}
											•{" "}
											{med.foodRelation === "before"
												? "Before food"
												: med.foodRelation === "after"
												? "After food"
												: med.foodRelation === "with"
												? "With food"
												: "On empty stomach"}
										</p>
										<p className="text-xs text-muted-foreground mt-1">
											{med.timings.length === 1
												? "1 time"
												: `${med.timings.length} times`}{" "}
											per day
										</p>
										<p className="text-xs text-muted-foreground mt-1">
											Tracking:{" "}
											{calculateTrackingDuration(med)}
										</p>
										{med.instructions && (
											<p className="text-xs text-muted-foreground mt-1">
												Instructions: {med.instructions}
											</p>
										)}
									</div>
									<div className="flex flex-col items-end gap-2">
										<span className="text-sm font-medium text-primary">
											{med.adherenceRate}% adherence
										</span>
										<div className="flex gap-2">
											<Button
												size="sm"
												variant="outline"
												onClick={() =>
													handleEditMedication(med)
												}
											>
												Edit
											</Button>
											<Button
												size="sm"
												variant="destructive"
												onClick={() =>
													handleDeleteMedication(
														med._id
													)
												}
											>
												Delete
											</Button>
										</div>
									</div>
								</div>
								<div className="w-full bg-muted rounded-full h-2 overflow-hidden">
									<div
										className="bg-primary h-full transition-all"
										style={{
											width: `${med.adherenceRate}%`,
										}}
									/>
								</div>
							</div>
						))
					)}
				</div>
			</Card>
		</div>
	);
}

export default MedicationManagement;

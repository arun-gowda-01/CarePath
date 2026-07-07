import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { patientApi } from "@/lib/api";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import type { SymptomCheckIn } from "@/lib/types";

function PatientCheckIn() {
	const { user } = useAuth();

	const [formData, setFormData] = useState({
		painLevel: 0,
		temperature: 37,
		bloodPressure: "120/80",
		mood: "good",
		notes: "",
	});

	const [loading, setLoading] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const [checkInHistory, setCheckInHistory] = useState<SymptomCheckIn[]>([]);
	const [historyLoading, setHistoryLoading] = useState(true);

	const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
	const [woundImage, setWoundImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);

	const [canSubmit, setCanSubmit] = useState(true);
	const [waitTimeMessage, setWaitTimeMessage] = useState("");

	const availableSymptoms = [
		"Fatigue",
		"Nausea",
		"Dizziness",
		"Headache",
		"Shortness of breath",
		"Loss of appetite",
		"Insomnia",
		"Muscle aches",
	];

	// -------------------------------
	// Fetch history and check last check-in
	// -------------------------------

	const fetchCheckInHistory = useCallback(async () => {
		if (!user?.id) return;

		try {
			setHistoryLoading(true);
			const { data } = await patientApi.getCheckIns(user.id, {
				page: 1,
				limit: 10,
			});

			const checkIns = data?.data?.checkIns || data?.data || [];
			setCheckInHistory(checkIns);

			// Check last check-in for timing validation
			if (checkIns.length > 0) {
				const last = checkIns[0];
				checkSubmitEligibility(last);
			}
		} catch (error) {
			if (isAxiosError(error)) {
				toast.error(
					error.response?.data?.message ||
						"Failed to load check-in history"
				);
			}
		} finally {
			setHistoryLoading(false);
		}
	}, [user?.id]);

	const checkSubmitEligibility = (lastCheckIn: SymptomCheckIn) => {
		const now = new Date();
		const lastDate = new Date(
			lastCheckIn.checkInDate || lastCheckIn.date || lastCheckIn.createdAt
		);

		const todayStart = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate()
		);
		const lastCheckInStart = new Date(
			lastDate.getFullYear(),
			lastDate.getMonth(),
			lastDate.getDate()
		);

		// Check if same day
		if (lastCheckInStart.getTime() === todayStart.getTime()) {
			setCanSubmit(false);
			setWaitTimeMessage(
				"You have already submitted a check-in today. Come back tomorrow!"
			);
			return;
		}

		// Check 8-hour gap
		const eightHoursInMs = 8 * 60 * 60 * 1000;
		const timeSinceLastCheckIn = now.getTime() - lastDate.getTime();

		if (timeSinceLastCheckIn < eightHoursInMs) {
			const hoursRemaining = Math.ceil(
				(eightHoursInMs - timeSinceLastCheckIn) / (60 * 60 * 1000)
			);
			setCanSubmit(false);
			setWaitTimeMessage(
				`Please wait ${hoursRemaining} hour(s) before submitting another check-in.`
			);
		} else {
			setCanSubmit(true);
			setWaitTimeMessage("");
		}
	};

	useEffect(() => {
		if (user?.id) fetchCheckInHistory();
	}, [user?.id, fetchCheckInHistory]);

	// -------------------------------
	// Image upload handling
	// -------------------------------

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		const validTypes = [
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/webp",
		];
		if (!validTypes.includes(file.type)) {
			toast.error("Only JPEG, PNG, and WebP images are allowed");
			return;
		}

		// Validate file size (5MB max)
		if (file.size > 5 * 1024 * 1024) {
			toast.error("Image size must be less than 5MB");
			return;
		}

		setWoundImage(file);

		// Create preview
		const reader = new FileReader();
		reader.onloadend = () => {
			setImagePreview(reader.result as string);
		};
		reader.readAsDataURL(file);
	};

	const removeImage = () => {
		setWoundImage(null);
		setImagePreview(null);
	};

	// -------------------------------
	// Submit handler
	// -------------------------------

	const handleSubmit = async () => {
		if (!user) {
			toast.error("User not found");
			return;
		}

		if (!canSubmit) {
			toast.error(waitTimeMessage);
			return;
		}

		if (formData.temperature < 30 || formData.temperature > 50) {
			toast.error("Temperature must be between 30–50°C");
			return;
		}

		if (formData.painLevel < 0 || formData.painLevel > 10) {
			toast.error("Pain level must be between 0–10");
			return;
		}

		try {
			setLoading(true);

			// Parse blood pressure string (e.g., "120/80") into systolic/diastolic
			const bpParts = formData.bloodPressure.split("/");
			const systolic = parseInt(bpParts[0]?.trim() || "0", 10);
			const diastolic = parseInt(bpParts[1]?.trim() || "0", 10);

			// If image exists, use FormData, otherwise use JSON
			let payload: FormData | any;

			if (woundImage) {
				// Use FormData for multipart upload
				const formDataPayload = new FormData();
				formDataPayload.append("userId", user.id);
				formDataPayload.append(
					"painLevel",
					formData.painLevel.toString()
				);
				formDataPayload.append(
					"temperature",
					formData.temperature.toString()
				);
				formDataPayload.append(
					"bloodPressure[systolic]",
					systolic.toString()
				);
				formDataPayload.append(
					"bloodPressure[diastolic]",
					diastolic.toString()
				);
				formDataPayload.append("mood", formData.mood);
				formDataPayload.append("notes", formData.notes);
				formDataPayload.append("woundImage", woundImage);

				// Add symptoms
				selectedSymptoms.forEach((symptom, index) => {
					formDataPayload.append(`symptoms[${index}]`, symptom);
				});

				payload = formDataPayload;
			} else {
				// Use JSON
				payload = {
					patientId: user.id,
					painLevel: formData.painLevel,
					temperature: formData.temperature,
					bloodPressure: {
						systolic,
						diastolic,
					},
					mood: formData.mood as
						| "poor"
						| "okay"
						| "good"
						| "excellent",
					notes: formData.notes,
					symptoms: selectedSymptoms.map((symptom) => ({
						type: symptom,
						description: symptom,
					})),
				};
			}

			const { data } = await patientApi.submitCheckIn(payload);

			if (data.success) {
				toast.success("Check-in submitted successfully!");

				// Reset form
				setFormData({
					painLevel: 0,
					temperature: 37,
					bloodPressure: "120/80",
					mood: "good",
					notes: "",
				});
				setSelectedSymptoms([]);
				removeImage();

				setSubmitted(true);
				setTimeout(() => setSubmitted(false), 2500);

				await fetchCheckInHistory();
			}
		} catch (error) {
			if (isAxiosError(error)) {
				toast.error(
					error.response?.data?.message || "Failed to submit check-in"
				);
			}
		} finally {
			setLoading(false);
		}
	};

	// -------------------------------
	// Alerts
	// -------------------------------

	const alerts = [];
	if (formData.temperature > 38) {
		alerts.push("High fever detected. Contact your care team.");
	}
	if (formData.painLevel > 8) {
		alerts.push("Severe pain reported. Consider pain management options.");
	}

	// -------------------------------
	// Helpers
	// -------------------------------

	const toggleSymptom = (symptom: string) => {
		setSelectedSymptoms((prev) =>
			prev.includes(symptom)
				? prev.filter((s) => s !== symptom)
				: [...prev, symptom]
		);
	};

	// Add helper to get the most recent check-in
	const latestCheckIn = checkInHistory.length > 0 ? checkInHistory[0] : null;

	// Helper to calculate time since last check-in
	const getTimeSinceCheckIn = (date: string | Date) => {
		const now = new Date();
		const checkInDate = new Date(date);
		const diffMs = now.getTime() - checkInDate.getTime();
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffHours / 24);

		if (diffDays > 0) {
			return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
		} else if (diffHours > 0) {
			return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
		} else {
			return "Just now";
		}
	};

	// Helper to get risk level based on vitals
	const getRiskIndicator = (checkIn: SymptomCheckIn) => {
		if (checkIn.temperature > 38 || checkIn.painLevel >= 8) {
			return {
				level: "High Risk",
				color: "bg-red-100 text-red-800 border-red-200",
			};
		} else if (checkIn.painLevel >= 6 || checkIn.temperature > 37.5) {
			return {
				level: "Monitor",
				color: "bg-yellow-100 text-yellow-800 border-yellow-200",
			};
		}
		return {
			level: "Stable",
			color: "bg-green-100 text-green-800 border-green-200",
		};
	};

	// -------------------------------
	// UI
	// -------------------------------

	return (
		<div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
			<h1 className="text-3xl font-bold">Symptom Check-in</h1>

			{/* Wait time message */}
			{!canSubmit && waitTimeMessage && (
				<div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
					<p className="text-sm font-medium text-yellow-800">
						{waitTimeMessage}
					</p>
				</div>
			)}

			{/* Alerts */}
			{alerts.length > 0 && (
				<div className="space-y-2">
					{alerts.map((msg, index) => (
						<div
							key={index}
							className="p-4 bg-red-50 border border-red-200 rounded-lg"
						>
							<p className="text-sm font-medium text-red-800">
								{msg}
							</p>
						</div>
					))}
				</div>
			)}

			{submitted && (
				<div className="p-4 bg-green-50 border border-green-200 rounded-lg">
					<p className="text-sm font-medium text-green-800">
						Check-in submitted successfully!
					</p>
				</div>
			)}

			{/* Form */}
			<Card className="p-6 space-y-6">
				{/* Pain */}
				<div className="space-y-3">
					<label className="font-semibold">
						Pain Level: {formData.painLevel}/10
					</label>
					<input
						type="range"
						min={0}
						max={10}
						value={formData.painLevel}
						onChange={(e) =>
							setFormData((p) => ({
								...p,
								painLevel: Number(e.target.value),
							}))
						}
						className="w-full h-2 bg-muted rounded-lg cursor-pointer"
					/>
					<div className="flex justify-between text-xs text-muted-foreground">
						<span>No Pain</span>
						<span>Severe Pain</span>
					</div>
				</div>

				{/* Temperature */}
				<div className="space-y-2">
					<label className="font-semibold">Temperature (°C)</label>
					<input
						type="number"
						step={0.1}
						value={formData.temperature}
						min={30}
						max={45}
						onChange={(e) =>
							setFormData((p) => ({
								...p,
								temperature: Number(e.target.value),
							}))
						}
						className="w-full px-3 py-2 border rounded-lg bg-input"
					/>
				</div>

				{/* Blood Pressure */}
				<div className="space-y-2">
					<label className="font-semibold">
						Blood Pressure (mmHg)
					</label>
					<input
						type="text"
						value={formData.bloodPressure}
						onChange={(e) =>
							setFormData((p) => ({
								...p,
								bloodPressure: e.target.value,
							}))
						}
						className="w-full px-3 py-2 border rounded-lg bg-input"
					/>
				</div>

				{/* Mood */}
				<div className="space-y-3">
					<label className="font-semibold">
						How are you feeling?
					</label>
					<div className="grid grid-cols-3 gap-2">
						{["poor", "okay", "good"].map((mood) => (
							<button
								key={mood}
								type="button"
								onClick={() =>
									setFormData((p) => ({ ...p, mood }))
								}
								className={`p-3 rounded-lg border-2 capitalize font-medium transition-all ${
									formData.mood === mood
										? "border-primary bg-primary/10 text-primary"
										: "border-border text-muted-foreground hover:border-primary/50"
								}`}
							>
								{mood}
							</button>
						))}
					</div>
				</div>

				{/* Symptoms */}
				<div className="space-y-3">
					<label className="font-semibold">
						Symptoms (Select all that apply)
					</label>
					<div className="grid grid-cols-2 gap-2">
						{availableSymptoms.map((symptom) => (
							<button
								key={symptom}
								type="button"
								onClick={() => toggleSymptom(symptom)}
								className={`p-2 rounded-lg border-2 text-sm transition-all ${
									selectedSymptoms.includes(symptom)
										? "border-primary bg-primary/10 text-primary"
										: "border-border text-muted-foreground hover:border-primary/50"
								}`}
							>
								{symptom}
							</button>
						))}
					</div>
				</div>

				{/* Notes */}
				<div className="space-y-2">
					<label className="font-semibold">Additional Notes</label>
					<textarea
						value={formData.notes}
						onChange={(e) =>
							setFormData((p) => ({
								...p,
								notes: e.target.value,
							}))
						}
						className="w-full px-3 py-2 border rounded-lg bg-input min-h-24 resize-none"
						placeholder="Any other symptoms or concerns?"
					/>
				</div>

				{/* Wound Image Upload */}
				<div className="space-y-3">
					<label className="font-semibold">
						Wound Image (Optional)
					</label>
					<div className="space-y-3">
						{imagePreview ? (
							<div className="relative">
								<img
									src={imagePreview}
									alt="Wound preview"
									className="w-full h-64 object-cover rounded-lg border"
								/>
								<button
									type="button"
									onClick={removeImage}
									className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
								>
									✕
								</button>
							</div>
						) : (
							<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
								<input
									type="file"
									accept="image/jpeg,image/jpg,image/png,image/webp"
									onChange={handleImageChange}
									className="hidden"
									id="wound-image-input"
								/>
								<label
									htmlFor="wound-image-input"
									className="cursor-pointer"
								>
									<div className="space-y-2">
										<div className="text-4xl">📷</div>
										<p className="text-sm text-muted-foreground">
											Click to upload wound image
										</p>
										<p className="text-xs text-muted-foreground">
											JPEG, PNG, WebP (Max 5MB)
										</p>
									</div>
								</label>
							</div>
						)}
					</div>
				</div>

				{/* Button */}
				<Button
					className="w-full"
					size="lg"
					onClick={handleSubmit}
					disabled={loading || !canSubmit}
				>
					{loading ? "Submitting..." : "Submit Check-in"}
				</Button>
			</Card>

			{/* History */}
			<div className="space-y-3">
				<h2 className="font-semibold text-lg">Check-in History</h2>

				{historyLoading ? (
					<div className="space-y-2">
						{[1, 2, 3].map((i) => (
							<Card key={i} className="p-4 space-y-3">
								<Skeleton className="h-4 w-48" />
								<Skeleton className="h-16 w-full" />
							</Card>
						))}
					</div>
				) : checkInHistory.length === 0 ? (
					<Card className="p-6 text-center text-muted-foreground">
						No check-ins yet. Submit your first check-in above!
					</Card>
				) : (
					<div className="space-y-2">
						{checkInHistory.map((checkin) => (
							<Card key={checkin._id} className="p-4 space-y-2">
								<div className="flex justify-between items-start">
									<p className="text-sm text-muted-foreground">
										{new Date(
											checkin.checkInDate ||
												checkin.date ||
												checkin.createdAt
										).toLocaleString()}
									</p>
								</div>

								<div className="grid grid-cols-3 gap-2 text-sm">
									<div>
										<p className="text-muted-foreground">
											Pain
										</p>
										<p className="font-semibold">
											{checkin.painLevel}/10
										</p>
									</div>
									<div>
										<p className="text-muted-foreground">
											Temp
										</p>
										<p className="font-semibold">
											{checkin.temperature}°C
										</p>
									</div>
									<div>
										<p className="text-muted-foreground">
											BP
										</p>
										<p className="font-semibold">
											{checkin.bloodPressure?.formatted ||
												(checkin.bloodPressure
													?.systolic &&
												checkin.bloodPressure?.diastolic
													? `${checkin.bloodPressure.systolic}/${checkin.bloodPressure.diastolic}`
													: "N/A")}
										</p>
									</div>
								</div>

								<div className="text-sm">
									<p className="text-muted-foreground">
										Mood
									</p>
									<p className="font-semibold capitalize">
										{checkin.mood}
									</p>
								</div>

								{checkin.symptoms &&
									checkin.symptoms.length > 0 && (
										<div className="text-sm">
											<p className="text-muted-foreground">
												Symptoms
											</p>
											<p className="font-semibold">
												{checkin.symptoms
													.map(
														(s) =>
															s.type ||
															s.description
													)
													.filter(Boolean)
													.join(", ")}
											</p>
										</div>
									)}

								{checkin.notes && (
									<p className="text-sm text-muted-foreground italic">
										"{checkin.notes}"
									</p>
								)}

								{checkin.image?.url && (
									<div className="mt-2">
										<img
											src={checkin.image.url}
											alt="Wound image"
											className="w-full h-48 object-cover rounded-lg border"
										/>
									</div>
								)}
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export default PatientCheckIn;

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { patientApi, medicationApi, doctorApi, messageApi } from "@/lib/api";
import type {
	Patient,
	Medication,
	Task,
	ExerciseTask,
	SymptomCheckIn,
	Message as ApiMessage,
	FollowUpConsultation,
} from "@/lib/types";
import PatientProfileHeader from "@/components/patient-profile/PatientProfileHeader";
import PatientOverview from "@/components/patient-profile/PatientOverview";
import MedicationManagement from "@/components/patient-profile/MedicationManagement";
import TaskManagement from "@/components/patient-profile/TaskManagement";
import ExerciseManagement from "@/components/patient-profile/ExerciseManagement";
import PatientMessages from "@/components/patient-profile/PatientMessages";
import FollowUpConsultations from "@/components/patient-profile/FollowUpConsultations";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import { getSocket } from "@/lib/socket";

function PatientProfile() {
	const { patientId } = useParams<{ patientId: string }>();
	const navigate = useNavigate();
	const { user } = useAuth();

	const [activeTab, setActiveTab] = useState<
		| "overview"
		| "checkins"
		| "medications"
		| "tasks"
		| "followups"
		| "exercises"
		| "messages"
	>("overview");

	const [patient, setPatient] = useState<Patient | null>(null);
	const [medications, setMedications] = useState<Medication[]>([]);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [followUpConsultations, setFollowUpConsultations] = useState<
		FollowUpConsultation[]
	>([]);
	const [exercises, setExercises] = useState<ExerciseTask[]>([]);
	const [checkIns, setCheckIns] = useState<SymptomCheckIn[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [patientUnreadCount, setPatientUnreadCount] = useState(0);

	// Dialog state for check-in details
	const [selectedCheckIn, setSelectedCheckIn] =
		useState<SymptomCheckIn | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedRiskLevel, setSelectedRiskLevel] = useState<
		"stable" | "monitor" | "critical"
	>("stable");
	const [updatingRisk, setUpdatingRisk] = useState(false);
	const [monitoringDaysInput, setMonitoringDaysInput] = useState("");
	const [updatingMonitoring, setUpdatingMonitoring] = useState(false);

	const fetchPatientData = useCallback(async () => {
		try {
			setLoading(true);
			const response = await patientApi.getPatientDetails(patientId!);
			const fetchedPatient = response.data.data as Patient;
			setPatient(fetchedPatient);
			setMonitoringDaysInput(
				fetchedPatient.monitoringDays !== undefined
					? String(fetchedPatient.monitoringDays)
					: "7"
			);
		} catch (err: unknown) {
			console.error("Error fetching patient:", err);
			setError(
				(err as { response?: { data?: { message?: string } } }).response
					?.data?.message || "Failed to load patient"
			);
		} finally {
			setLoading(false);
		}
	}, [patientId]);

	const fetchMedications = useCallback(async () => {
		try {
			const response = await medicationApi.getPatientMedications(
				patientId!
			);
			setMedications(response.data.data || []);
		} catch (err: unknown) {
			console.error("Error fetching medications:", err);
		}
	}, [patientId]);

	const fetchTasks = useCallback(async () => {
		try {
			const response = await doctorApi.getTasks(patientId!);
			setTasks(response.data.data || []);
		} catch (err: unknown) {
			console.error("Error fetching tasks:", err);
		}
	}, [patientId]);

	const fetchFollowUpConsultations = useCallback(async () => {
		try {
			const response = await doctorApi.getPatientFollowUpConsultations(
				patientId!
			);
			setFollowUpConsultations(response.data.data || []);
		} catch (err: unknown) {
			console.error("Error fetching follow-up consultations:", err);
		}
	}, [patientId]);

	const fetchExercises = useCallback(async () => {
		try {
			const response = await doctorApi.getPatientExercises(patientId!);
			setExercises(response.data.data || []);

			console.log(response);
		} catch (err: unknown) {
			console.error("Error fetching exercises:", err);
		}
	}, [patientId]);

	const fetchCheckIns = useCallback(async () => {
		try {
			const response = await doctorApi.getCheckIns(patientId!);
			console.log(response);
			setCheckIns(
				response.data.data?.checkIns || response.data.data || []
			);
		} catch (err: unknown) {
			console.error("Error fetching check-ins:", err);
		}
	}, [patientId]);

	const refreshPatientUnreadCount = useCallback(async () => {
		if (!user || !patient) return;
		try {
			const response = await messageApi.getAllConversations();
			const data = (response.data.data || []) as Array<{
				conversationId: string;
				otherUser: {
					_id: string;
					firstName: string;
					lastName: string;
					role: string;
				};
				lastMessage?: ApiMessage;
				unreadCount?: number;
			}>;

			const patientConvs = data.filter(
				(c) => c.otherUser._id === patient.userId._id
			);
			const totalUnread = patientConvs.reduce(
				(sum, c) => sum + (c.unreadCount || 0),
				0
			);
			setPatientUnreadCount(totalUnread);
		} catch {
			// ignore
		}
	}, [user, patient]);

	const handleCheckInClick = (checkIn: SymptomCheckIn) => {
		setSelectedCheckIn(checkIn);
		setSelectedRiskLevel(patient?.riskLevel || "stable");
		setDialogOpen(true);
	};

	const handleMarkAsReviewed = async () => {
		if (!selectedCheckIn) return;

		try {
			await doctorApi.markCheckInAsReviewed(selectedCheckIn._id);
			toast.success("Check-in marked as reviewed");
			fetchCheckIns();
			setDialogOpen(false);
		} catch (error) {
			if (isAxiosError(error)) {
				toast.error(
					error.response?.data?.message ||
						"Failed to mark as reviewed"
				);
			}
		}
	};

	const handleUpdateMonitoringDuration = async () => {
		if (!patientId) return;
		const value = Number(monitoringDaysInput);
		if (!value || value < 1) {
			toast.error("Monitoring duration must be at least 1 day");
			return;
		}

		try {
			setUpdatingMonitoring(true);
			await doctorApi.updatePatientMonitoringDuration(patientId, value);
			toast.success("Monitoring duration updated");
			fetchPatientData();
		} catch (error) {
			if (isAxiosError(error)) {
				toast.error(
					error.response?.data?.message ||
						"Failed to update monitoring duration"
				);
			}
		} finally {
			setUpdatingMonitoring(false);
		}
	};

	useEffect(() => {
		if (!user || !patient) return;
		const socket = getSocket();

		const handleNewMessage = (msg: unknown) => {
			try {
				const rawSender = (msg as Record<string, unknown>)?.senderId;
				const rawReceiver = (msg as Record<string, unknown>)
					?.receiverId;
				const senderId =
					rawSender && typeof rawSender === "object"
						? (rawSender as Record<string, unknown>)._id
						: rawSender;
				const receiverId =
					rawReceiver && typeof rawReceiver === "object"
						? (rawReceiver as Record<string, unknown>)._id
						: rawReceiver;

				if (!senderId || !receiverId) return;

				const patientUserId = patient.userId._id;

				if (receiverId === user.id && senderId === patientUserId) {
					setPatientUnreadCount((prev) => prev + 1);
				}
			} catch {
				// ignore
			}
		};

		const handleMessageRead = () => {
			refreshPatientUnreadCount();
		};

		socket.on("message:new", handleNewMessage);
		socket.on("message:read", handleMessageRead);

		return () => {
			socket.off("message:new", handleNewMessage);
			socket.off("message:read", handleMessageRead);
		};
	}, [user, patient, refreshPatientUnreadCount]);

	const handleUpdateRiskLevel = async () => {
		if (!patientId) return;

		try {
			setUpdatingRisk(true);
			await doctorApi.updatePatientRiskLevel(
				patientId,
				selectedRiskLevel
			);
			toast.success("Patient risk level updated");
			fetchPatientData();
			handleMarkAsReviewed();
		} catch (error) {
			if (isAxiosError(error)) {
				toast.error(
					error.response?.data?.message ||
						"Failed to update risk level"
				);
			}
		} finally {
			setUpdatingRisk(false);
		}
	};

	useEffect(() => {
		if (!patientId) {
			setError("No patient ID provided");
			setLoading(false);
			return;
		}

		fetchPatientData();
		fetchMedications();
		fetchTasks();
		fetchFollowUpConsultations();
		fetchExercises();
		fetchCheckIns();
	}, [
		patientId,
		fetchPatientData,
		fetchMedications,
		fetchTasks,
		fetchFollowUpConsultations,
		fetchExercises,
		fetchCheckIns,
	]);

	if (loading) {
		return (
			<div className="p-4 md:p-6">
				<p className="text-muted-foreground">Loading patient data...</p>
			</div>
		);
	}

	if (error || !patient) {
		return (
			<div className="p-4 md:p-6">
				<Card className="p-4 bg-red-50 border-red-200">
					<p className="text-red-800">
						{error || "Patient not found"}
					</p>
					<Button
						size="sm"
						variant="outline"
						onClick={() => navigate("/doctor/dashboard")}
						className="mt-2"
					>
						Back to Dashboard
					</Button>
				</Card>
			</div>
		);
	}

	return (
		<div className="p-4 md:p-6 space-y-6">
			<PatientProfileHeader patient={patient} />
			<Card className="p-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
				<div>
					<p className="text-sm text-muted-foreground">
						Monitoring Duration
					</p>
					<p className="text-sm text-foreground">
						Currently monitoring for {patient.monitoringDays ?? 7} days
					</p>
				</div>
				<div className="flex flex-col md:flex-row gap-2 md:items-end">
					<div className="space-y-1">
						<Label htmlFor="monitoringDays">Monitoring days</Label>
						<Input
							id="monitoringDays"
							type="number"
							min={1}
							value={monitoringDaysInput}
							onChange={(e) => setMonitoringDaysInput(e.target.value)}
							className="w-32"
						/>
					</div>
					<Button
						onClick={handleUpdateMonitoringDuration}
						disabled={updatingMonitoring}
					>
						{updatingMonitoring
							? "Updating..."
							: "Update Monitoring"}
					</Button>
				</div>
			</Card>

			{/* Tabs */}
			<div className="flex gap-2 border-b border-border overflow-x-auto">
				{(
					[
						"overview",
						"checkins",
						"medications",
						"tasks",
						"followups",
						"exercises",
						"messages",
					] as const
				).map((tab) => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab)}
						className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
							activeTab === tab
								? "text-primary border-b-2 border-primary"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						{tab === "checkins" ? (
							"Check-Ins"
						) : tab === "followups" ? (
							"Follow-up Visits"
						) : tab === "messages" ? (
							<span className="inline-flex items-center gap-2">
								<span>Messages</span>
								{patientUnreadCount > 0 && (
									<span className="inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] min-w-4 h-4 px-1">
										{patientUnreadCount > 9
											? "9+"
											: patientUnreadCount}
									</span>
								)}
							</span>
						) : (
							tab.charAt(0).toUpperCase() + tab.slice(1)
						)}
					</button>
				))}
			</div>

			{/* Tab Content */}
			<div className="space-y-4">
				{activeTab === "overview" && (
					<PatientOverview patient={patient} />
				)}

				{activeTab === "checkins" && (
					<div className="space-y-4">
						<Card className="p-6 space-y-4">
							<h2 className="font-semibold text-lg text-foreground">
								Check-In History
							</h2>

							{checkIns.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									No check-ins yet for this patient.
								</p>
							) : (
								<div className="space-y-4">
									{/* Unread Check-ins */}
									{checkIns.filter((c) => !c.isRead).length >
										0 && (
										<div className="space-y-2">
											<h3 className="font-medium text-sm text-foreground">
												Unread Check-Ins
											</h3>
											{checkIns
												.filter((c) => !c.isRead)
												.map((checkin) => (
													<Card
														key={checkin._id}
														onClick={() =>
															handleCheckInClick(
																checkin
															)
														}
														className="p-4 space-y-2 cursor-pointer hover:shadow-md transition-shadow bg-yellow-50 border-yellow-200"
													>
														<div className="flex justify-between items-start">
															<p className="text-sm text-muted-foreground">
																{new Date(
																	checkin.checkInDate ||
																		checkin.date ||
																		checkin.createdAt
																).toLocaleString()}
															</p>
															<span className="text-xs px-2 py-1 rounded-md border bg-yellow-100 text-yellow-800 border-yellow-300">
																Unread
															</span>
														</div>

														<div className="grid grid-cols-3 gap-2 text-sm">
															<div>
																<p className="text-muted-foreground">
																	Pain
																</p>
																<p className="font-semibold">
																	{
																		checkin.painLevel
																	}
																	/10
																</p>
															</div>
															<div>
																<p className="text-muted-foreground">
																	Temp
																</p>
																<p className="font-semibold">
																	{
																		checkin.temperature
																	}
																	°C
																</p>
															</div>
															<div>
																<p className="text-muted-foreground">
																	Mood
																</p>
																<p className="font-semibold capitalize">
																	{
																		checkin.mood
																	}
																</p>
															</div>
														</div>

														{checkin.image?.url && (
															<div className="text-xs text-muted-foreground">
																📷 Wound image
																attached
															</div>
														)}
													</Card>
												))}
										</div>
									)}

									{/* Read Check-ins */}
									{checkIns.filter((c) => c.isRead).length >
										0 && (
										<div className="space-y-2">
											<h3 className="font-medium text-sm text-foreground">
												Read Check-Ins
											</h3>
											{checkIns
												.filter((c) => c.isRead)
												.map((checkin) => (
													<Card
														key={checkin._id}
														onClick={() =>
															handleCheckInClick(
																checkin
															)
														}
														className="p-4 space-y-2 cursor-pointer hover:shadow-md transition-shadow bg-white border-gray-200"
													>
														<div className="flex justify-between items-start">
															<p className="text-sm text-muted-foreground">
																{new Date(
																	checkin.checkInDate ||
																		checkin.date ||
																		checkin.createdAt
																).toLocaleString()}
															</p>
															<span className="text-xs px-2 py-1 rounded-md border bg-green-100 text-green-800 border-green-200">
																Read
															</span>
														</div>

														<div className="grid grid-cols-3 gap-2 text-sm">
															<div>
																<p className="text-muted-foreground">
																	Pain
																</p>
																<p className="font-semibold">
																	{
																		checkin.painLevel
																	}
																	/10
																</p>
															</div>
															<div>
																<p className="text-muted-foreground">
																	Temp
																</p>
																<p className="font-semibold">
																	{
																		checkin.temperature
																	}
																	°C
																</p>
															</div>
															<div>
																<p className="text-muted-foreground">
																	Mood
																</p>
																<p className="font-semibold capitalize">
																	{
																		checkin.mood
																	}
																</p>
															</div>
														</div>

														{checkin.image?.url && (
															<div className="text-xs text-muted-foreground">
																📷 Wound image
																attached
															</div>
														)}
													</Card>
												))}
										</div>
									)}
								</div>
							)}
						</Card>
					</div>
				)}

				{activeTab === "medications" && (
					<MedicationManagement
						patientId={patientId!}
						medications={medications}
						onUpdate={fetchMedications}
					/>
				)}

				{activeTab === "tasks" && (
					<TaskManagement
						patientId={patientId!}
						tasks={tasks}
						onUpdate={fetchTasks}
					/>
				)}
				{activeTab === "followups" && (
					<FollowUpConsultations
						patientId={patientId!}
						appointments={followUpConsultations}
						onUpdate={fetchFollowUpConsultations}
					/>
				)}
				{activeTab === "exercises" && (
					<ExerciseManagement
						patientId={patientId!}
						exercises={exercises}
						onUpdate={fetchExercises}
					/>
				)}

				{activeTab === "messages" && (
					<PatientMessages patient={patient} activeTab={activeTab} />
				)}
			</div>

			{/* Check-In Details Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Check-In Details</DialogTitle>
					</DialogHeader>

					{selectedCheckIn && (
						<div className="space-y-4">
							<div className="text-sm text-muted-foreground">
								{new Date(
									selectedCheckIn.checkInDate ||
										selectedCheckIn.date ||
										selectedCheckIn.createdAt
								).toLocaleString()}
							</div>

							{/* Vitals */}
							<div className="gap-4">
								<div className="space-y-1 flex items-center gap-5">
									<p className="text-sm text-muted-foreground">
										Pain Level
									</p>
									<p className="font-bold">
										{selectedCheckIn.painLevel}/10
									</p>
								</div>
								<div className="space-y-1 flex items-center gap-5">
									<p className="text-sm text-muted-foreground">
										Temperature
									</p>
									<p className="font-bold">
										{selectedCheckIn.temperature}°C
									</p>
								</div>
								<div className="space-y-1 flex items-center gap-5">
									<p className="text-sm text-muted-foreground">
										Blood Pressure
									</p>
									<p className="font-bold">
										{selectedCheckIn.bloodPressure
											?.formatted ||
											(selectedCheckIn.bloodPressure
												?.systolic &&
											selectedCheckIn.bloodPressure
												?.diastolic
												? `${selectedCheckIn.bloodPressure.systolic}/${selectedCheckIn.bloodPressure.diastolic}`
												: "N/A")}
									</p>
								</div>
								<div className="space-y-1 flex items-center gap-5">
									<p className="text-sm text-muted-foreground">
										Mood
									</p>
									<p className="font-bold capitalize">
										{selectedCheckIn.mood}
									</p>
								</div>
							</div>

							{/* Symptoms */}
							{selectedCheckIn.symptoms &&
								selectedCheckIn.symptoms.length > 0 && (
									<div className="space-y-2">
										<p className="text-sm font-medium">
											Reported Symptoms
										</p>
										<div className="flex flex-wrap gap-2">
											{selectedCheckIn.symptoms.map(
												(symptom, idx) => (
													<span
														key={idx}
														className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm"
													>
														{symptom.type ||
															symptom.description}
													</span>
												)
											)}
										</div>
									</div>
								)}

							{/* Notes */}
							{selectedCheckIn.notes && (
								<div className="space-y-2">
									<p className="text-sm font-medium">
										Additional Notes
									</p>
									<p className="text-sm text-muted-foreground">
										{selectedCheckIn.notes}
									</p>
								</div>
							)}

							{/* Wound Image */}
							{selectedCheckIn.image?.url && (
								<div className="space-y-2">
									<p className="text-sm font-medium">
										Wound Image
									</p>
									<img
										src={selectedCheckIn.image.url}
										alt="Wound"
										className="w-full h-auto max-h-96 object-contain rounded-lg border"
									/>
								</div>
							)}

							{/* Risk Level Management */}
							<div className="space-y-3 pt-4 border-t">
								<p className="text-sm font-medium">
									Update Patient Risk Level
								</p>
								<Select
									value={selectedRiskLevel}
									onValueChange={(value) =>
										setSelectedRiskLevel(
											value as
												| "stable"
												| "monitor"
												| "critical"
										)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select risk level" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="stable">
											Stable
										</SelectItem>
										<SelectItem value="monitor">
											Monitor
										</SelectItem>
										<SelectItem value="critical">
											Critical
										</SelectItem>
									</SelectContent>
								</Select>

								<div className="flex gap-2">
									{!selectedCheckIn.isRead && (
										<Button
											onClick={handleMarkAsReviewed}
											variant="outline"
											className="flex-1"
										>
											Mark as Reviewed
										</Button>
									)}
									<Button
										onClick={handleUpdateRiskLevel}
										disabled={
											updatingRisk ||
											selectedRiskLevel ===
												patient?.riskLevel
										}
										className="flex-1"
									>
										{updatingRisk
											? "Updating..."
											: "Update Risk Level"}
									</Button>
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default PatientProfile;

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { formatDate } from "@/lib/formatDate";

interface Patient {
	id: string;
	name: string;
	procedure: string;
	procedureDate: string;
	assignedTo?: string;
	assignedDate?: string;
	assignmentId?: string;
}

interface Doctor {
	id: string;
	name: string;
	role: string;
}

interface ApiDoctor {
	_id: string;
	userId: {
		_id: string;
		firstName: string;
		lastName: string;
		fullName: string;
		isActive: boolean;
		id: string;
	};
	role: string;
}

interface ApiAssignedPatient {
	assignmentId: string;
	assignedDate: string;
	userId: {
		_id: string;
		firstName: string;
		lastName: string;
		fullName: string;
		isActive: boolean;
		id: string; // This is the actual patient ID
	};
	procedure: string;
	procedureDate: string;
}

interface ApiUnassignedPatient {
	_id: string;
	userId: {
		_id: string;
		firstName: string;
		lastName: string;
		fullName: string;
		isActive: boolean;
		id: string;
	};
	procedure: string;
	procedureDate: string;
}

interface ApiAssignment {
	doctor: ApiDoctor;
	patients: ApiAssignedPatient[];
	patientCount: number;
}

interface ApiResponse {
	success: boolean;
	message: string;
	data: {
		assignments: ApiAssignment[];
		unassignedPatients: ApiUnassignedPatient[];
	};
}

export default function AssignmentMatrix() {
	const [doctors, setDoctors] = useState<Doctor[]>([]);
	const [patients, setPatients] = useState<Patient[]>([]);
	const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
		null
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchAssignments();
	}, []);

	const fetchAssignments = async () => {
		try {
			setLoading(true);

			const response = await axios.get<ApiResponse>(
				`${import.meta.env.VITE_BACKEND_URL}/admin/assignments`,
				{ withCredentials: true }
			);

			const { assignments, unassignedPatients } = response.data.data;

			// Map doctors
			const doctorsList: Doctor[] = assignments.map((assignment) => ({
				id: assignment.doctor._id,
				name: assignment.doctor.userId.fullName,
				role: assignment.doctor.role,
			}));

			setDoctors(doctorsList);

			// Map assigned patients (using new response structure)
			const assignedPatients: Patient[] = assignments.flatMap(
				(assignment) =>
					assignment.patients.map((p) => ({
						id: p.userId.id, // actual patient ID
						name: p.userId.fullName,
						procedure: p.procedure || "N/A",
						procedureDate: p.procedureDate || "",
						assignedTo: assignment.doctor._id,
						assignedDate: p.assignedDate,
						assignmentId: p.assignmentId,
					}))
			);

			// Map unassigned patients (old format)
			const unassigned: Patient[] = unassignedPatients.map((p) => ({
				id: p._id,
				name: p.userId.fullName,
				procedure: p.procedure,
				procedureDate: p.procedureDate,
				assignedTo: undefined,
			}));

			setPatients([...assignedPatients, ...unassigned]);
			setError(null);
		} catch (err) {
			console.error("Error fetching assignments:", err);
			setError("Failed to load assignments. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const assignPatient = async (patientId: string, doctorId: string) => {
		try {
			await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/admin/assignment`,
				{ patientId, doctorId },
				{ withCredentials: true }
			);

			setPatients(
				patients.map((p) =>
					p.id === patientId
						? {
								...p,
								assignedTo: doctorId,
								assignedDate: new Date()
									.toISOString()
									.split("T")[0],
						  }
						: p
				)
			);
			setIsDialogOpen(false);
			setSelectedPatient(null);
		} catch (err) {
			console.error("Error assigning patient:", err);
			setError("Failed to assign patient. Please try again.");
		}
	};

	const removePatient = async (assignmentId: string) => {
		try {
			console.log(assignmentId);
			await axios.delete(
				`${
					import.meta.env.VITE_BACKEND_URL
				}/admin/assignment/${assignmentId}`,
				{ withCredentials: true }
			);

			// Refetch assignments to get updated data
			await fetchAssignments();
		} catch (err) {
			console.error("Error removing patient:", err);
			setError("Failed to remove patient. Please try again.");
		}
	};

	const getAssignedPatients = (doctorId: string) => {
		return patients.filter((p) => p.assignedTo === doctorId);
	};

	const unassignedPatients = patients.filter((p) => !p.assignedTo);

	const openAssignDialog = (patient: Patient) => {
		setSelectedPatient(patient);
		setIsDialogOpen(true);
	};

	if (loading) {
		return (
			<div className="space-y-4">
				<h2 className="text-xl font-semibold text-foreground">
					Assignment Matrix
				</h2>
				<p className="text-sm text-muted-foreground">
					Loading assignments...
				</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="space-y-4">
				<h2 className="text-xl font-semibold text-foreground">
					Assignment Matrix
				</h2>
				<Card className="p-4 bg-red-50 border-red-200">
					<p className="text-sm text-red-800">{error}</p>
					<Button
						onClick={fetchAssignments}
						className="mt-2"
						size="sm"
					>
						Retry
					</Button>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<h2 className="text-xl font-semibold text-foreground">
				Assignment Matrix
			</h2>
			<p className="text-sm text-muted-foreground">
				Manage patient-to-doctor assignments for care routing
			</p>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Left Panel - Doctors with Assigned Patients */}
				<Card className="p-4 ">
					<h3 className="text-lg font-semibold text-foreground mb-4">
						Doctors & Assigned Patients
					</h3>
					<Accordion
						type="single"
						collapsible
						className="space-y-2 my-2"
					>
						{doctors.map((doctor) => {
							const assignedPatients = getAssignedPatients(
								doctor.id
							);
							return (
								<AccordionItem
									key={doctor.id}
									value={`doctor-${doctor.id}`}
									className="border rounded-lg px-4"
								>
									<AccordionTrigger className="hover:no-underline">
										{/* Updated to shadcn-style trigger: single-row with chevron */}
										<div className="flex w-full items-center justify-between">
											<div className="flex flex-col items-start text-left">
												<span className="font-semibold text-foreground">
													{doctor.name}
												</span>
												<span className="text-sm text-muted-foreground">
													{doctor.role} •{" "}
													{assignedPatients.length}{" "}
													patient(s)
												</span>
											</div>
										</div>
									</AccordionTrigger>
									<AccordionContent>
										{assignedPatients.length === 0 ? (
											<p className="text-sm text-muted-foreground py-2">
												No patients assigned
											</p>
										) : (
											<div className="space-y-2 pt-2">
												{assignedPatients.map(
													(patient) => (
														<div
															key={patient.id}
															className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
														>
															<div className="flex-1">
																<div className="flex items-center gap-8 mb-1">
																	<p className="font-medium text-foreground">
																		{
																			patient.name
																		}
																	</p>
																	<Badge
																		variant="default"
																		className="text-xs"
																	>
																		{
																			patient.procedure
																		}
																	</Badge>
																</div>
																{patient.procedureDate && (
																	<p className="text-xs text-muted-foreground">
																		Procedure
																		Date:{" "}
																		{formatDate(
																			patient.procedureDate
																		)}
																	</p>
																)}
																<p className="text-xs text-muted-foreground">
																	Assigned:{" "}
																	{formatDate(
																		patient.assignedDate as string
																	)}
																</p>
															</div>
															<Button
																size="sm"
																variant="destructive"
																onClick={() =>
																	removePatient(
																		patient.assignmentId!
																	)
																}
															>
																Remove
															</Button>
														</div>
													)
												)}
											</div>
										)}
									</AccordionContent>
								</AccordionItem>
							);
						})}
					</Accordion>
				</Card>

				{/* Right Panel - Unassigned Patients */}
				<Card className="p-4">
					<h3 className="text-lg font-semibold text-foreground mb-4">
						Unassigned Patients ({unassignedPatients.length})
					</h3>
					{unassignedPatients.length === 0 ? (
						<p className="text-sm text-muted-foreground py-4">
							All patients are assigned to doctors
						</p>
					) : (
						<div className="space-y-3">
							{unassignedPatients.map((patient) => (
								<div
									key={patient.id}
									className="p-4 border border-border rounded-lg space-y-3"
								>
									<div className="flex flex-col gap-2">
										<div className="flex items-center gap-2">
											<p className="font-medium text-foreground">
												{patient.name}
											</p>
											<Badge
												variant="outline"
												className="text-xs"
											>
												{patient.procedure}
											</Badge>
										</div>
										<p className="text-xs text-muted-foreground">
											Procedure Date:{" "}
											{new Date(
												patient.procedureDate
											).toLocaleDateString()}
										</p>
									</div>
									<Button
										size="sm"
										variant="default"
										onClick={() =>
											openAssignDialog(patient)
										}
										className=""
									>
										Assign to Doctor
									</Button>
								</div>
							))}
						</div>
					)}
				</Card>
			</div>

			{/* Assignment Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Assign Patient to Doctor</DialogTitle>
						<DialogDescription>
							Select a doctor to assign {selectedPatient?.name}{" "}
							for {selectedPatient?.procedure}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2 pt-4 h-96 overflow-y-auto">
						{[...doctors]
							.sort((a, b) => a.name.localeCompare(b.name))
							.map((doctor) => (
								<Button
									key={doctor.id}
									variant="outline"
									className="w-full justify-start h-auto py-3"
									onClick={() =>
										assignPatient(
											selectedPatient!.id,
											doctor.id
										)
									}
								>
									<div className="flex flex-col items-start text-left">
										<span className="font-semibold">
											{doctor.name}
										</span>
										<span className="text-xs text-muted-foreground">
											{doctor.role}
										</span>
									</div>
								</Button>
							))}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

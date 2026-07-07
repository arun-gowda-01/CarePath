import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export interface IPatient {
	_id: string;
	userId: {
		fullName: string;
		email: string;
		_id: string;
		isActive: boolean;
	};
	dateOfBirth: Date;
	procedure: string;
	procedureDate: Date;
	riskLevel: "critical" | "stable" | "monitor";
}

export default function PatientEnrollment() {
	const [showNewPatientForm, setShowNewPatientForm] = useState(false);
	const [editingPatientId, setEditingPatientId] = useState<string | null>(
		null
	);
	const [newPatientForm, setNewPatientForm] = useState({
		firstName: "",
		lastName: "",
		email: "",
		password: "",
		dateOfBirth: "",
		phone: "",
		address: {
			street: "",
			city: "",
			state: "",
			zipCode: "",
		},
		procedure: "",
		procedureDate: "",
		riskLevel: "stable" as "stable" | "monitor" | "critical",
	});
	const [currentPage, setCurrentPage] = useState(1);
	const [patients, setPatients] = useState<
		Array<IPatient & { _id: string; fullName: string }>
	>([]);
	const [pagination, setPagination] = useState({
		currentPage: 1,
		totalPages: 1,
		totalPatients: 0,
		limit: 10,
	});
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isFetchingDetails, setIsFetchingDetails] = useState(false);
	const [deletingPatientId, setDeletingPatientId] = useState<string | null>(
		null
	);
	const [patientToDelete, setPatientToDelete] = useState<string | null>(null);

	useEffect(() => {
		const fetchPatients = async () => {
			setIsLoading(true);
			setIsError(false);
			setError(null);
			try {
				const { data } = await axios.get(
					`${import.meta.env.VITE_BACKEND_URL}/admin/patients`,
					{
						withCredentials: true,
						params: { page: currentPage },
					}
				);
				setPatients(data.data.patients || []);
				setPagination(
					data.data.pagination || {
						currentPage: 1,
						totalPages: 1,
						totalPatients: 0,
						limit: 10,
					}
				);
			} catch (err: unknown) {
				setIsError(true);
				if (axios.isAxiosError(err)) {
					setError(
						new Error(err?.response?.data?.message || err.message)
					);
				} else if (err instanceof Error) {
					setError(err);
				} else {
					setError(new Error("An unknown error occurred"));
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchPatients();
	}, [currentPage]);

	const addPatient = async (patientData: typeof newPatientForm) => {
		setIsSubmitting(true);
		try {
			const payload = {
				...patientData,
				dateOfBirth: patientData.dateOfBirth,
				procedureDate: patientData.procedureDate,
				address:
					patientData.address.street ||
					patientData.address.city ||
					patientData.address.state ||
					patientData.address.zipCode
						? patientData.address
						: undefined,
				phone: patientData.phone || undefined,
			};

			await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/admin/patient`,
				payload,
				{
					withCredentials: true,
				}
			);

			toast.success("Patient enrolled successfully!");
			resetForm();
			setShowNewPatientForm(false);
			const { data } = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/admin/patients`,
				{
					withCredentials: true,
					params: { page: currentPage },
				}
			);
			setPatients(data.data.patients || []);
			setPagination(
				data.data.pagination || {
					currentPage: 1,
					totalPages: 1,
					totalPatients: 0,
					limit: 10,
				}
			);
		} catch (err: unknown) {
			if (axios.isAxiosError(err)) {
				toast.error(
					err?.response?.data?.message ||
						err.message ||
						"Failed to enroll patient"
				);
			} else if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error("An unknown error occurred");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const fetchPatientDetails = async (patientId: string) => {
		setIsFetchingDetails(true);
		try {
			const { data } = await axios.get(
				`${
					import.meta.env.VITE_BACKEND_URL
				}/admin/patient/${patientId}`,
				{
					withCredentials: true,
				}
			);
			const patientData = data.data;
			setNewPatientForm({
				firstName: patientData.userId.fullName.split(" ")[0] || "",
				lastName:
					patientData.userId.fullName.split(" ").slice(1).join(" ") ||
					"",
				email: patientData.userId.email || "",
				password: "",
				dateOfBirth: patientData.dateOfBirth
					? new Date(patientData.dateOfBirth)
							.toISOString()
							.split("T")[0]
					: "",
				phone: patientData.phone || "",
				address: {
					street: patientData.address?.street || "",
					city: patientData.address?.city || "",
					state: patientData.address?.state || "",
					zipCode: patientData.address?.zipCode || "",
				},
				procedure: patientData.procedure || "",
				procedureDate: patientData.procedureDate
					? new Date(patientData.procedureDate)
							.toISOString()
							.split("T")[0]
					: "",
				riskLevel: patientData.riskLevel || "stable",
			});
		} catch (err: unknown) {
			if (axios.isAxiosError(err)) {
				toast.error(
					err?.response?.data?.message ||
						err.message ||
						"Failed to fetch patient details"
				);
			} else if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error("An unknown error occurred");
			}
		} finally {
			setIsFetchingDetails(false);
		}
	};

	const updatePatient = async (
		patientId: string,
		patientData: typeof newPatientForm
	) => {
		setIsSubmitting(true);
		try {
			const payload = {
				...patientData,
				dateOfBirth: patientData.dateOfBirth,
				procedureDate: patientData.procedureDate,
				address:
					patientData.address.street ||
					patientData.address.city ||
					patientData.address.state ||
					patientData.address.zipCode
						? patientData.address
						: undefined,
				phone: patientData.phone || undefined,
				password: patientData.password || undefined,
			};

			await axios.patch(
				`${
					import.meta.env.VITE_BACKEND_URL
				}/admin/patient/${patientId}`,
				payload,
				{
					withCredentials: true,
				}
			);

			toast.success("Patient updated successfully!");
			resetForm();
			setEditingPatientId(null);
			const { data } = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/admin/patients`,
				{
					withCredentials: true,
					params: { page: currentPage },
				}
			);
			setPatients(data.data.patients || []);
			setPagination(
				data.data.pagination || {
					currentPage: 1,
					totalPages: 1,
					totalPatients: 0,
					limit: 10,
				}
			);
		} catch (err: unknown) {
			if (axios.isAxiosError(err)) {
				toast.error(
					err?.response?.data?.message ||
						err.message ||
						"Failed to update patient"
				);
			} else if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error("An unknown error occurred");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteClick = (patientId: string) => {
		setPatientToDelete(patientId);
	};

	const confirmDelete = async () => {
		if (!patientToDelete) return;

		setDeletingPatientId(patientToDelete);
		try {
			await axios.delete(
				`${
					import.meta.env.VITE_BACKEND_URL
				}/admin/patient/${patientToDelete}`,
				{
					withCredentials: true,
				}
			);

			toast.success("Patient deleted successfully!");
			setPatientToDelete(null);
			const { data } = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/admin/patients`,
				{
					withCredentials: true,
					params: { page: currentPage },
				}
			);
			setPatients(data.data.patients || []);
			setPagination(
				data.data.pagination || {
					currentPage: 1,
					totalPages: 1,
					totalPatients: 0,
					limit: 10,
				}
			);
		} catch (err: unknown) {
			if (axios.isAxiosError(err)) {
				toast.error(
					err?.response?.data?.message ||
						err.message ||
						"Failed to delete patient"
				);
			} else if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error("An unknown error occurred");
			}
		} finally {
			setDeletingPatientId(null);
		}
	};

	if (isError) {
		return (
			<div className="space-y-4">
				<div className="flex justify-between items-center">
					<h2 className="text-xl font-semibold text-foreground">
						Patient Enrollment & Activation
					</h2>
				</div>
				<Card className="p-6">
					<div className="text-center text-red-600">
						<p className="font-semibold mb-2">
							Error loading patients
						</p>
						<p className="text-sm">
							{error?.message || "An unexpected error occurred"}
						</p>
					</div>
				</Card>
			</div>
		);
	}

	const resetForm = () => {
		setNewPatientForm({
			firstName: "",
			lastName: "",
			email: "",
			password: "",
			dateOfBirth: "",
			phone: "",
			address: {
				street: "",
				city: "",
				state: "",
				zipCode: "",
			},
			procedure: "",
			procedureDate: "",
			riskLevel: "stable",
		});
	};

	const handleAddPatient = () => {
		if (
			!newPatientForm.firstName.trim() ||
			!newPatientForm.lastName.trim() ||
			!newPatientForm.email.trim() ||
			!newPatientForm.dateOfBirth ||
			!newPatientForm.procedure.trim() ||
			!newPatientForm.procedureDate
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		if (!editingPatientId && !newPatientForm.password.trim()) {
			toast.error("Password is required");
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(newPatientForm.email)) {
			toast.error("Please enter a valid email address");
			return;
		}

		if (newPatientForm.password && newPatientForm.password.length < 6) {
			toast.error("Password must be at least 6 characters long");
			return;
		}

		if (editingPatientId) {
			updatePatient(editingPatientId, newPatientForm);
		} else {
			addPatient(newPatientForm);
		}
	};

	const handleEditPatient = (patientId: string) => {
		setEditingPatientId(patientId);
		fetchPatientDetails(patientId);
	};

	const handleCloseDialog = () => {
		setShowNewPatientForm(false);
		setEditingPatientId(null);
		resetForm();
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-xl font-semibold text-foreground">
					Patient Enrollment & Activation
				</h2>
				<Button onClick={() => setShowNewPatientForm(true)}>
					Enroll New Patient
				</Button>
			</div>

			<Dialog
				open={showNewPatientForm || editingPatientId !== null}
				onOpenChange={(open) => {
					if (!open) {
						handleCloseDialog();
					}
				}}
			>
				<DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thin scrollbar-thumb-neutral-500">
					<DialogHeader>
						<DialogTitle>
							{editingPatientId
								? "Edit Patient"
								: "Enroll New Patient"}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-4">
						{isFetchingDetails ? (
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Skeleton className="h-4 w-20" />
										<Skeleton className="h-10 w-full" />
									</div>
									<div className="space-y-2">
										<Skeleton className="h-4 w-20" />
										<Skeleton className="h-10 w-full" />
									</div>
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-10 w-full" />
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-10 w-full" />
									</div>
									<div className="space-y-2">
										<Skeleton className="h-4 w-16" />
										<Skeleton className="h-10 w-full" />
									</div>
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-20" />
									<div className="space-y-3 pl-4">
										<Skeleton className="h-10 w-full" />
										<div className="grid grid-cols-3 gap-2">
											<Skeleton className="h-10 w-full" />
											<Skeleton className="h-10 w-full" />
											<Skeleton className="h-10 w-full" />
										</div>
									</div>
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-10 w-full" />
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Skeleton className="h-4 w-28" />
										<Skeleton className="h-10 w-full" />
									</div>
									<div className="space-y-2">
										<Skeleton className="h-4 w-20" />
										<Skeleton className="h-10 w-full" />
									</div>
								</div>
							</div>
						) : (
							<>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="firstName">
											First Name *
										</Label>
										<Input
											id="firstName"
											value={newPatientForm.firstName}
											onChange={(e) =>
												setNewPatientForm({
													...newPatientForm,
													firstName: e.target.value,
												})
											}
											placeholder="John"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="lastName">
											Last Name *
										</Label>
										<Input
											id="lastName"
											value={newPatientForm.lastName}
											onChange={(e) =>
												setNewPatientForm({
													...newPatientForm,
													lastName: e.target.value,
												})
											}
											placeholder="Doe"
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="email">Email *</Label>
									<Input
										id="email"
										type="email"
										value={newPatientForm.email}
										onChange={(e) =>
											setNewPatientForm({
												...newPatientForm,
												email: e.target.value,
											})
										}
										placeholder="john.doe@example.com"
									/>
								</div>

								{!editingPatientId && (
									<div className="space-y-2">
										<Label htmlFor="password">
											Password *
										</Label>
										<Input
											id="password"
											type="password"
											value={newPatientForm.password}
											onChange={(e) =>
												setNewPatientForm({
													...newPatientForm,
													password: e.target.value,
												})
											}
											placeholder="Minimum 6 characters"
										/>
									</div>
								)}

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="dateOfBirth">
											Date of Birth *
										</Label>
										<Input
											id="dateOfBirth"
											type="date"
											value={newPatientForm.dateOfBirth}
											onChange={(e) =>
												setNewPatientForm({
													...newPatientForm,
													dateOfBirth: e.target.value,
												})
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="phone">Phone</Label>
										<Input
											id="phone"
											type="tel"
											value={newPatientForm.phone}
											onChange={(e) =>
												setNewPatientForm({
													...newPatientForm,
													phone: e.target.value,
												})
											}
											placeholder="+91 1234567890"
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label>Address</Label>
									<div className="space-y-3 pl-4">
										<Input
											placeholder="Street"
											value={
												newPatientForm.address.street
											}
											onChange={(e) =>
												setNewPatientForm({
													...newPatientForm,
													address: {
														...newPatientForm.address,
														street: e.target.value,
													},
												})
											}
										/>
										<div className="grid grid-cols-3 gap-2">
											<Input
												placeholder="City"
												value={
													newPatientForm.address.city
												}
												onChange={(e) =>
													setNewPatientForm({
														...newPatientForm,
														address: {
															...newPatientForm.address,
															city: e.target
																.value,
														},
													})
												}
											/>
											<Input
												placeholder="State"
												value={
													newPatientForm.address.state
												}
												onChange={(e) =>
													setNewPatientForm({
														...newPatientForm,
														address: {
															...newPatientForm.address,
															state: e.target
																.value,
														},
													})
												}
											/>
											<Input
												placeholder="Zip Code"
												value={
													newPatientForm.address
														.zipCode
												}
												onChange={(e) =>
													setNewPatientForm({
														...newPatientForm,
														address: {
															...newPatientForm.address,
															zipCode:
																e.target.value,
														},
													})
												}
											/>
										</div>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="procedure">
										Procedure *
									</Label>
									<Input
										id="procedure"
										value={newPatientForm.procedure}
										onChange={(e) =>
											setNewPatientForm({
												...newPatientForm,
												procedure: e.target.value,
											})
										}
										placeholder="e.g., Knee Replacement"
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="procedureDate">
											Procedure Date *
										</Label>
										<Input
											id="procedureDate"
											type="date"
											value={newPatientForm.procedureDate}
											onChange={(e) =>
												setNewPatientForm({
													...newPatientForm,
													procedureDate:
														e.target.value,
												})
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="riskLevel">
											Risk Level
										</Label>
										<Select
											value={newPatientForm.riskLevel}
											onValueChange={(
												value:
													| "stable"
													| "monitor"
													| "critical"
											) =>
												setNewPatientForm({
													...newPatientForm,
													riskLevel: value,
												})
											}
										>
											<SelectTrigger id="riskLevel">
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
									</div>
								</div>
							</>
						)}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={handleCloseDialog}
							disabled={isSubmitting || isFetchingDetails}
						>
							Cancel
						</Button>
						<Button
							onClick={handleAddPatient}
							disabled={isSubmitting || isFetchingDetails}
						>
							{isSubmitting
								? editingPatientId
									? "Updating..."
									: "Enrolling..."
								: editingPatientId
								? "Update Patient"
								: "Enroll Patient"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{isLoading ? (
				<div className="space-y-3">
					{[1, 2, 3].map((i) => (
						<Card key={i} className="p-4">
							<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
								<div className="flex-1 space-y-3">
									<Skeleton className="h-6 w-48" />
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-4 w-40" />
									<Skeleton className="h-6 w-16" />
								</div>
								<div className="flex gap-2">
									<Skeleton className="h-9 w-28" />
									<Skeleton className="h-9 w-20" />
								</div>
							</div>
						</Card>
					))}
				</div>
			) : (
				<div className="space-y-3">
					{patients.map((patient) => (
						<Card key={patient._id} className="p-4">
							<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
								<div className="flex-1">
									<h3 className="font-semibold text-foreground mb-1">
										{patient.userId.fullName}
									</h3>
									<p className="text-sm text-muted-foreground">
										DOB:{" "}
										{new Date(
											patient.dateOfBirth
										).toLocaleDateString()}
									</p>
									<p className="text-sm text-muted-foreground">
										Procedure: {patient.procedure}
									</p>
									<span
										className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
											patient.userId.isActive
												? "bg-green-100 text-green-800"
												: "bg-gray-100 text-gray-800"
										}`}
									>
										{patient.userId.isActive
											? "Active"
											: "Inactive"}
									</span>
								</div>
								<div className="flex gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() =>
											handleEditPatient(patient._id)
										}
									>
										<Pencil className="w-4 h-4 mr-2" />
										Edit Details
									</Button>
									<Button
										size="sm"
										variant="destructive"
										onClick={() =>
											handleDeleteClick(patient._id)
										}
										disabled={
											deletingPatientId === patient._id
										}
									>
										<Trash2 className="w-4 h-4 mr-2" />
										{deletingPatientId === patient._id
											? "Deleting..."
											: "Delete"}
									</Button>
								</div>
							</div>
						</Card>
					))}
				</div>
			)}

			{pagination.totalPages > 1 && (
				<div className="flex items-center justify-center gap-2 pt-4">
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							setCurrentPage((prev) => Math.max(1, prev - 1))
						}
						disabled={currentPage === 1}
					>
						Previous
					</Button>
					<div className="flex items-center gap-1">
						{Array.from(
							{ length: pagination.totalPages },
							(_, i) => i + 1
						).map((page) => (
							<Button
								key={page}
								variant={
									currentPage === page ? "default" : "outline"
								}
								size="sm"
								onClick={() => setCurrentPage(page)}
								className="min-w-10"
							>
								{page}
							</Button>
						))}
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							setCurrentPage((prev) =>
								Math.min(pagination.totalPages, prev + 1)
							)
						}
						disabled={currentPage === pagination.totalPages}
					>
						Next
					</Button>
					<span className="text-sm text-muted-foreground ml-4">
						Page {pagination.currentPage} of {pagination.totalPages}{" "}
						({pagination.totalPatients} total patients)
					</span>
				</div>
			)}

			<AlertDialog
				open={patientToDelete !== null}
				onOpenChange={(open) => !open && setPatientToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently
							delete the patient and all associated data from the
							system.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							disabled={deletingPatientId !== null}
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							disabled={deletingPatientId !== null}
							className="bg-destructive text-white hover:bg-destructive/90"
						>
							{deletingPatientId ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

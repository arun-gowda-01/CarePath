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

interface IDoctor {
	_id: string;
	userId: {
		firstName: string;
		lastName: string;
		email: string;
		_id: string;
		isActive: boolean;
	};
	role: string;
	phone?: string;
	specialization?: string;
	licenseNumber?: string;
}

const defaultPagination = {
	currentPage: 1,
	totalPages: 1,
	totalItems: 0,
	itemsPerPage: 10,
};

export default function DoctorManagement() {
	const [doctors, setDoctors] = useState<IDoctor[]>([]);
	const [showNewDoctorForm, setShowNewDoctorForm] = useState(false);
	const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
	const [newDoctorForm, setNewDoctorForm] = useState({
		firstName: "",
		lastName: "",
		email: "",
		password: "",
		role: "",
		phone: "",
		specialization: "",
		licenseNumber: "",
	});
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState(defaultPagination);
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isFetchingDetails, setIsFetchingDetails] = useState(false);
	const [deletingDoctorId, setDeletingDoctorId] = useState<string | null>(
		null
	);
	const [doctorToDelete, setDoctorToDelete] = useState<string | null>(null);

	// -------------------------------------
	// UNIFIED RELOAD FUNCTION
	// -------------------------------------
	const reloadDoctors = async (page = currentPage) => {
		const res = await axios.get(
			`${import.meta.env.VITE_BACKEND_URL}/admin/doctors`,
			{
				withCredentials: true,
				params: { page },
			}
		);

		setDoctors(res.data.data.doctors || []);
		setPagination(res.data.data.pagination || defaultPagination);
	};

	// -------------------------------------
	// INITIAL FETCH
	// -------------------------------------
	useEffect(() => {
		const fetchDoctors = async () => {
			setIsLoading(true);
			setIsError(false);
			setError(null);
			try {
				await reloadDoctors(currentPage);
			} catch (err: unknown) {
				setIsError(true);

				if (axios.isAxiosError(err)) {
					setError(
						new Error(err?.response?.data?.message || err.message)
					);
				} else {
					setError(new Error("An unknown error occurred"));
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchDoctors();
	}, [currentPage]);

	// -------------------------------------
	// FETCH ONE DOCTOR DETAILS
	// -------------------------------------
	const fetchDoctorDetails = async (doctorId: string) => {
		setIsFetchingDetails(true);
		try {
			const { data } = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/admin/doctor/${doctorId}`,
				{ withCredentials: true }
			);

			const doctorData = data.data;
			setNewDoctorForm({
				firstName: doctorData.userId.firstName || "",
				lastName: doctorData.userId.lastName || "",
				email: doctorData.userId.email || "",
				password: "",
				role: doctorData.role || "",
				phone: doctorData.phone || "",
				specialization: doctorData.specialization || "",
				licenseNumber: doctorData.licenseNumber || "",
			});
		} catch (err: unknown) {
			toast.error("Failed to fetch doctor details");
		} finally {
			setIsFetchingDetails(false);
		}
	};

	// -------------------------------------
	// ADD DOCTOR
	// -------------------------------------
	const addDoctor = async (doctorData: typeof newDoctorForm) => {
		setIsSubmitting(true);
		try {
			const payload = {
				...doctorData,
				phone: doctorData.phone || undefined,
				specialization: doctorData.specialization || undefined,
				licenseNumber: doctorData.licenseNumber || undefined,
			};

			await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/admin/doctor`,
				payload,
				{ withCredentials: true }
			);

			toast.success("Doctor added successfully!");

			resetForm();
			setShowNewDoctorForm(false);

			await reloadDoctors();
		} catch (err) {
			console.log(err);
			
			toast.error("Failed to add doctor");
		} finally {
			setIsSubmitting(false);
		}
	};

	// -------------------------------------
	// UPDATE DOCTOR
	// -------------------------------------
	const updateDoctor = async (
		doctorId: string,
		doctorData: typeof newDoctorForm
	) => {
		setIsSubmitting(true);
		try {
			const payload = {
				...doctorData,
				password: doctorData.password || undefined,
				phone: doctorData.phone || undefined,
				specialization: doctorData.specialization || undefined,
				licenseNumber: doctorData.licenseNumber || undefined,
			};

			await axios.patch(
				`${import.meta.env.VITE_BACKEND_URL}/admin/doctor/${doctorId}`,
				payload,
				{ withCredentials: true }
			);

			toast.success("Doctor updated successfully!");

			resetForm();
			setEditingDoctorId(null);

			await reloadDoctors();
		} catch {
			toast.error("Failed to update doctor");
		} finally {
			setIsSubmitting(false);
		}
	};

	// -------------------------------------
	// DELETE DOCTOR
	// -------------------------------------
	const confirmDelete = async () => {
		if (!doctorToDelete) return;

		setDeletingDoctorId(doctorToDelete);

		try {
			await axios.delete(
				`${
					import.meta.env.VITE_BACKEND_URL
				}/admin/doctor/${doctorToDelete}`,
				{ withCredentials: true }
			);

			toast.success("Doctor deleted successfully!");
			setDoctorToDelete(null);

			await reloadDoctors();
		} catch {
			toast.error("Failed to delete doctor");
		} finally {
			setDeletingDoctorId(null);
		}
	};

	const resetForm = () => {
		setNewDoctorForm({
			firstName: "",
			lastName: "",
			email: "",
			password: "",
			role: "",
			phone: "",
			specialization: "",
			licenseNumber: "",
		});
	};

	const handleAddDoctor = () => {
		if (
			!newDoctorForm.firstName.trim() ||
			!newDoctorForm.lastName.trim() ||
			!newDoctorForm.email.trim() ||
			!newDoctorForm.role.trim()
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		if (!editingDoctorId && !newDoctorForm.password.trim()) {
			toast.error("Password is required");
			return;
		}

		if (editingDoctorId) updateDoctor(editingDoctorId, newDoctorForm);
		else addDoctor(newDoctorForm);
	};

	const handleEditDoctor = (doctorId: string) => {
		setEditingDoctorId(doctorId);
		fetchDoctorDetails(doctorId);
	};

	const handleCloseDialog = () => {
		setShowNewDoctorForm(false);
		setEditingDoctorId(null);
		resetForm();
	};

	// -------------------------------------
	// ERROR UI
	// -------------------------------------
	if (isError) {
		return (
			<div className="space-y-4">
				<h2 className="text-xl font-semibold text-foreground">
					Doctor Management & Verification
				</h2>
				<Card className="p-6 text-center text-red-600">
					<p className="font-semibold mb-2">Error loading doctors</p>
					<p className="text-sm">{error?.message}</p>
				</Card>
			</div>
		);
	}

	// -------------------------------------
	// MAIN RETURN
	// -------------------------------------
	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-xl font-semibold text-foreground">
					Doctor Management & Verification
				</h2>
				<Button onClick={() => setShowNewDoctorForm(true)}>
					Add New Doctor
				</Button>
			</div>

			{/* Dialog */}
			<Dialog
				open={showNewDoctorForm || editingDoctorId !== null}
				onOpenChange={(open) => !open && handleCloseDialog()}
			>
				<DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{editingDoctorId ? "Edit Doctor" : "Add New Doctor"}
						</DialogTitle>
					</DialogHeader>

					{/* FORM CONTENT */}
					<div className="space-y-4 py-4">
						{isFetchingDetails ? (
							<Skeleton className="h-20" />
						) : (
							<>
								{/* FIRST NAME + LAST NAME */}
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>First Name *</Label>
										<Input
											value={newDoctorForm.firstName}
											onChange={(e) =>
												setNewDoctorForm({
													...newDoctorForm,
													firstName: e.target.value,
												})
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>Last Name *</Label>
										<Input
											value={newDoctorForm.lastName}
											onChange={(e) =>
												setNewDoctorForm({
													...newDoctorForm,
													lastName: e.target.value,
												})
											}
										/>
									</div>
								</div>

								{/* EMAIL */}
								<div className="space-y-2">
									<Label>Email *</Label>
									<Input
										type="email"
										value={newDoctorForm.email}
										onChange={(e) =>
											setNewDoctorForm({
												...newDoctorForm,
												email: e.target.value,
											})
										}
									/>
								</div>

								{/* PASSWORD (only new) */}
								{!editingDoctorId && (
									<div className="space-y-2">
										<Label>Password *</Label>
										<Input
											type="password"
											value={newDoctorForm.password}
											onChange={(e) =>
												setNewDoctorForm({
													...newDoctorForm,
													password: e.target.value,
												})
											}
										/>
									</div>
								)}

								{/* ROLE */}
								<div className="space-y-2">
									<Label>Role *</Label>
									<Select
										value={newDoctorForm.role}
										onValueChange={(v) =>
											setNewDoctorForm({
												...newDoctorForm,
												role: v,
											})
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select role" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Surgeon">
												Surgeon
											</SelectItem>
											<SelectItem value="Cardiologist">
												Cardiologist
											</SelectItem>
											<SelectItem value="Nurse">
												Nurse
											</SelectItem>
											<SelectItem value="Care Coordinator">
												Care Coordinator
											</SelectItem>
											<SelectItem value="Physical Therapist">
												Physical Therapist
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{/* PHONE + LICENSE */}
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Phone</Label>
										<Input
											value={newDoctorForm.phone}
											onChange={(e) =>
												setNewDoctorForm({
													...newDoctorForm,
													phone: e.target.value,
												})
											}
										/>
									</div>

									<div className="space-y-2">
										<Label>License Number</Label>
										<Input
											value={newDoctorForm.licenseNumber}
											onChange={(e) =>
												setNewDoctorForm({
													...newDoctorForm,
													licenseNumber:
														e.target.value,
												})
											}
										/>
									</div>
								</div>

								{/* SPECIALIZATION */}
								<div className="space-y-2">
									<Label>Specialization</Label>
									<Input
										value={newDoctorForm.specialization}
										onChange={(e) =>
											setNewDoctorForm({
												...newDoctorForm,
												specialization: e.target.value,
											})
										}
									/>
								</div>
							</>
						)}
					</div>

					{/* FOOTER BUTTONS */}
					<DialogFooter>
						<Button
							variant="outline"
							onClick={handleCloseDialog}
							disabled={isSubmitting || isFetchingDetails}
						>
							Cancel
						</Button>
						<Button
							onClick={handleAddDoctor}
							disabled={isSubmitting || isFetchingDetails}
						>
							{isSubmitting
								? editingDoctorId
									? "Updating..."
									: "Adding..."
								: editingDoctorId
								? "Update Doctor"
								: "Add Doctor"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* DOCTOR LIST */}
			{isLoading ? (
				<div className="space-y-3">
					{[1, 2, 3].map((i) => (
						<Card key={i} className="p-4">
							<Skeleton className="h-20" />
						</Card>
					))}
				</div>
			) : (
				<div className="space-y-3">
					{doctors.map((doctor) => (
						<Card key={doctor._id} className="p-4">
							<div className="flex justify-between items-start">
								<div>
									<h3 className="font-semibold">
										{doctor.userId.firstName}{" "}
										{doctor.userId.lastName}
									</h3>
									<p>{doctor.role}</p>
									<p>{doctor.userId.email}</p>
								</div>

								<div className="flex gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() =>
											handleEditDoctor(doctor._id)
										}
									>
										<Pencil className="w-4 h-4 mr-2" />
										Edit
									</Button>
									<Button
										size="sm"
										variant="destructive"
										onClick={() =>
											setDoctorToDelete(doctor._id)
										}
									>
										<Trash2 className="w-4 h-4 mr-2" />
										Delete
									</Button>
								</div>
							</div>
						</Card>
					))}
				</div>
			)}

			{/* PAGINATION */}
			{pagination.totalPages > 1 && (
				<div className="flex items-center justify-center gap-2 pt-4">
					<Button
						variant="outline"
						size="sm"
						disabled={currentPage === 1}
						onClick={() =>
							setCurrentPage((prev) => Math.max(1, prev - 1))
						}
					>
						Previous
					</Button>

					{Array.from(
						{ length: pagination.totalPages },
						(_, i) => i + 1
					).map((page) => (
						<Button
							key={page}
							size="sm"
							variant={
								page === currentPage ? "default" : "outline"
							}
							onClick={() => setCurrentPage(page)}
						>
							{page}
						</Button>
					))}

					<Button
						variant="outline"
						size="sm"
						disabled={currentPage === pagination.totalPages}
						onClick={() =>
							setCurrentPage((prev) =>
								Math.min(pagination.totalPages, prev + 1)
							)
						}
					>
						Next
					</Button>
				</div>
			)}

			{/* DELETE CONFIRMATION */}
			<AlertDialog
				open={doctorToDelete !== null}
				onOpenChange={(open) => !open && setDoctorToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>

					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-white"
							onClick={confirmDelete}
						>
							{deletingDoctorId ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

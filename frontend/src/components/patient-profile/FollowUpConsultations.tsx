import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { doctorApi } from "@/lib/api";
import type {
	FollowUpConsultation,
	CreateFollowUpConsultationData,
} from "@/lib/types";

interface FollowUpConsultationsProps {
	patientId: string;
	appointments: FollowUpConsultation[];
	onUpdate: () => void;
}

function FollowUpConsultations({
	patientId,
	appointments,
	onUpdate,
}: FollowUpConsultationsProps) {
	const [showForm, setShowForm] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	const [form, setForm] = useState<CreateFollowUpConsultationData>({
		patientId,
		title: "Follow-up physical consultation",
		description: "",
		scheduledTime: new Date().toISOString().slice(0, 16),
		priority: "medium",
		location: "",
	});

	const handleSave = async () => {
		try {
			if (!form.title || !form.scheduledTime) {
				alert("Please enter a title and schedule time");
				return;
			}

			if (editingId) {
				await doctorApi.updateFollowUpConsultation(editingId, {
					title: form.title,
					description: form.description,
					scheduledTime: form.scheduledTime,
					priority: form.priority,
					location: form.location,
				});
			} else {
				await doctorApi.createFollowUpConsultation(form);
			}

			setShowForm(false);
			setEditingId(null);
			setForm({
				patientId,
				title: "Follow-up physical consultation",
				description: "",
				scheduledTime: new Date().toISOString().slice(0, 16),
				priority: "medium",
				location: "",
			});
			onUpdate();
		} catch (err: unknown) {
			console.error("Error saving follow-up consultation:", err);
			alert(
				(err as { response?: { data?: { message?: string } } }).response?.data
					?.message || "Failed to save follow-up consultation"
			);
		}
	};

	const handleEdit = (appointment: FollowUpConsultation) => {
		setEditingId(appointment._id);
		setForm({
			patientId,
			title: appointment.title,
			description: appointment.description || "",
			scheduledTime: new Date(appointment.scheduledTime)
				.toISOString()
				.slice(0, 16),
			priority: appointment.priority,
			location: appointment.location || "",
		});
		setShowForm(true);
	};

	const handleDelete = async (appointmentId: string) => {
		if (!confirm("Are you sure you want to delete this follow-up consultation?")) {
			return;
		}

		try {
			await doctorApi.deleteFollowUpConsultation(appointmentId);
			onUpdate();
		} catch (err: unknown) {
			console.error("Error deleting follow-up consultation:", err);
			alert(
				(err as { response?: { data?: { message?: string } } }).response?.data
					?.message || "Failed to delete follow-up consultation"
			);
		}
	};

	return (
		<div className="space-y-4">
			<Card className="p-6 space-y-4">
				<div className="flex justify-between items-center">
					<h2 className="font-semibold text-lg text-foreground">
						Follow-up Physical Consultations
					</h2>
					<Button
						size="sm"
						onClick={() => {
							setShowForm(!showForm);
							setEditingId(null);
							setForm({
								patientId,
								title: "Follow-up physical consultation",
								description: "",
								scheduledTime: new Date().toISOString().slice(0, 16),
								priority: "medium",
								location: "",
							});
						}}
					>
						{showForm ? "Cancel" : "Schedule Follow-up"}
					</Button>
				</div>

				{showForm && (
					<Card className="p-4 bg-muted/30 space-y-4">
						<h3 className="font-medium text-foreground">
							{editingId ? "Edit" : "New"} Follow-up Consultation
						</h3>
						<div className="grid grid-cols-1 gap-4">
							<div>
								<Label htmlFor="followup-title">Title *</Label>
								<Input
									id="followup-title"
									value={form.title}
									onChange={(e) =>
										setForm({
											...form,
											title: e.target.value,
										})
									}
									placeholder="e.g., 2-week post-op physical visit"
								/>
							</div>

							<div>
								<Label htmlFor="followup-description">
									Notes / Description
								</Label>
								<Textarea
									id="followup-description"
									value={form.description}
									onChange={(e) =>
										setForm({
											...form,
											description: e.target.value,
										})
									}
									placeholder="Special instructions, notes..."
									rows={3}
								/>
							</div>

							<div>
								<Label htmlFor="followup-location">Location</Label>
								<Input
									id="followup-location"
									value={form.location}
									onChange={(e) =>
										setForm({
											...form,
											location: e.target.value,
										})
									}
									placeholder="Clinic address, room number..."
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label htmlFor="followup-time">
										Scheduled Date & Time *
									</Label>
									<Input
										id="followup-time"
										type="datetime-local"
										value={form.scheduledTime}
										onChange={(e) =>
											setForm({
												...form,
												scheduledTime: e.target.value,
											})
										}
									/>
								</div>

								<div className="space-y-3">
									<Label>Priority *</Label>
									<RadioGroup
										value={form.priority}
										onValueChange={(value: "low" | "medium" | "high") =>
											setForm({
												...form,
												priority: value,
											})
										}
									>
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="low" id="followup-low" />
											<Label
													htmlFor="followup-low"
													className="font-normal cursor-pointer"
												>
													Low Priority
												</Label>
										</div>
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="medium" id="followup-medium" />
											<Label
													htmlFor="followup-medium"
													className="font-normal cursor-pointer"
												>
													Medium Priority
												</Label>
										</div>
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="high" id="followup-high" />
											<Label
													htmlFor="followup-high"
													className="font-normal cursor-pointer"
												>
													High Priority
												</Label>
										</div>
									</RadioGroup>
								</div>
							</div>
						</div>
						<Button onClick={handleSave}>
							{editingId ? "Update" : "Schedule"} Follow-up
						</Button>
					</Card>
				)}

				<div className="space-y-3">
					{appointments.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-8">
							No follow-up consultations scheduled yet
						</p>
					) : (
						appointments
							.slice()
							.sort(
								(a, b) =>
									new Date(a.scheduledTime).getTime() -
									new Date(b.scheduledTime).getTime()
							)
							.map((appointment) => {
								const scheduledDate = new Date(appointment.scheduledTime);
								const isPast = scheduledDate < new Date();

								return (
									<div
										key={appointment._id}
										className={`p-4 border rounded-lg ${
											isPast
												? "border-muted bg-muted/40"
												: "border-border"
										}`}
									>
										<div className="flex justify-between items-start mb-2">
											<div className="flex-1">
												<p className="font-semibold text-foreground">
													{appointment.title}
												</p>
												{appointment.description && (
													<p className="text-sm text-muted-foreground mb-2 whitespace-pre-line">
														{appointment.description}
													</p>
												)}
												<div className="flex items-center gap-4 text-xs text-muted-foreground">
													<span>
														📅{" "}
														{scheduledDate.toLocaleDateString("en-US", {
															weekday: "short",
															month: "short",
															day: "numeric",
														})}
													</span>
													<span>
														🕒{" "}
														{scheduledDate.toLocaleTimeString("en-US", {
															hour: "numeric",
															minute: "2-digit",
														})}
													</span>
													<span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground capitalize">
														{appointment.priority}
													</span>
													{appointment.status === "completed" && (
														<span className="text-xs text-green-600">
															Completed
														</span>
													)}
													{appointment.status === "cancelled" && (
														<span className="text-xs text-red-600">
															Cancelled
														</span>
													)}
													{appointment.status === "scheduled" && isPast && (
														<span className="text-xs text-muted-foreground">
															Past due
														</span>
													)}
													{appointment.location && (
														<span className="text-xs text-muted-foreground">
															📍 {appointment.location}
														</span>
													)}
												</div>
											</div>
											<div className="flex gap-2">
												<Button
													size="sm"
													variant="outline"
													onClick={() => handleEdit(appointment)}
												>
													Edit
												</Button>
												<Button
													size="sm"
													variant="destructive"
													onClick={() => handleDelete(appointment._id)}
												>
													Delete
												</Button>
											</div>
										</div>
									</div>
								);
							})
						)}
				</div>
			</Card>
		</div>
	);
}

export default FollowUpConsultations;

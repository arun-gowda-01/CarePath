import { useState } from "react";
import DoctorManagement from "@/components/DoctorManagement";
import PatientEnrollment from "@/components/PatientEnrollment";
import AssignmentMatrix from "@/components/AssignmentMatrix";

export default function UserManagementDashboard() {
	const [activeTab, setActiveTab] = useState<
		"doctors" | "patients" | "assignments"
	>("doctors");

	return (
		<div className="p-4 md:p-6 space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-foreground">
					User Management
				</h1>
				<p className="text-muted-foreground">
					Manage doctors, patients, and care team assignments
				</p>
			</div>

			<div className="flex gap-2 border-b border-border overflow-x-auto">
				{(["doctors", "patients", "assignments"] as const).map(
					(tab) => (
						<button
							key={tab}
							onClick={() => setActiveTab(tab)}
							className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
								activeTab === tab
									? "text-primary border-b-2 border-primary"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							{tab === "doctors" && "Doctor Management"}
							{tab === "patients" && "Patient Enrollment"}
							{tab === "assignments" && "Assignment Matrix"}
						</button>
					)
				)}
			</div>

			{activeTab === "doctors" && <DoctorManagement />}

			{activeTab === "patients" && <PatientEnrollment />}

			{activeTab === "assignments" && <AssignmentMatrix />}
		</div>
	);
}

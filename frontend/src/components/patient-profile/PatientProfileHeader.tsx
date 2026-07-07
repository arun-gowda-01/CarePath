import { Card } from "@/components/ui/card";
import type { Patient } from "@/lib/types";

interface PatientProfileHeaderProps {
	patient: Patient;
}

function PatientProfileHeader({ patient }: PatientProfileHeaderProps) {
	const patientName = `${patient.userId.firstName} ${patient.userId.lastName}`;

	return (
		<>
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold text-foreground">
						{patientName}
					</h1>
					<p className="text-muted-foreground">{patient.procedure}</p>
				</div>
				<span
					className={`px-4 py-2 rounded-full font-medium w-fit ${
						patient.riskLevel === "stable"
							? "bg-green-100 text-green-800"
							: patient.riskLevel === "monitor"
							? "bg-yellow-100 text-yellow-800"
							: "bg-red-100 text-red-800"
					}`}
				>
					{patient.riskLevel.charAt(0).toUpperCase() +
						patient.riskLevel.slice(1)}
				</span>
			</div>

			{/* Key Metrics */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<Card className="p-4">
					<p className="text-sm text-muted-foreground">Age</p>
					<p className="text-2xl font-bold text-foreground">
						{patient.age}
					</p>
				</Card>
				<Card className="p-4">
					<p className="text-sm text-muted-foreground">
						Days Post-Op
					</p>
					<p className="text-2xl font-bold text-foreground">
						Day {patient.daysPostOp}
					</p>
				</Card>
				<Card className="p-4">
					<p className="text-sm text-muted-foreground">Adherence</p>
					<p className="text-2xl font-bold text-foreground">
						{patient.adherenceRate}%
					</p>
				</Card>
				<Card className="p-4">
					<p className="text-sm text-muted-foreground">Status</p>
					<p className="text-lg font-semibold text-foreground capitalize">
						{patient.status}
					</p>
				</Card>
			</div>

			{/* Contact Information */}
			<Card className="p-4 space-y-2">
				<h3 className="font-semibold text-foreground">
					Contact Information
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
					<div>
						<p className="text-muted-foreground">Phone</p>
						<p className="font-medium text-foreground">
							{patient.phone || "Not provided"}
						</p>
					</div>
					<div>
						<p className="text-muted-foreground">Email</p>
						<p className="font-medium text-foreground">
							{patient.userId.email}
						</p>
					</div>
				</div>
			</Card>
		</>
	);
}

export default PatientProfileHeader;

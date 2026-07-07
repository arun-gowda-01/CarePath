import { Card } from "@/components/ui/card";
import type { Patient } from "@/lib/types";
import { formatDate } from "@/lib/formatDate";

interface PatientOverviewProps {
	patient: Patient;
}

function PatientOverview({ patient }: PatientOverviewProps) {
	const patientName = `${patient.userId.firstName} ${patient.userId.lastName}`;

	return (
		<div className="space-y-4">
			{/* Patient Demographics */}
			<Card className="p-6 space-y-4">
				<h2 className="font-semibold text-lg text-foreground">
					Patient Demographics
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<div>
						<p className="text-sm text-muted-foreground">
							Full Name
						</p>
						<p className="font-medium text-foreground">
							{patientName}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">
							Date of Birth
						</p>
						<p className="font-medium text-foreground">
							{formatDate(patient.dateOfBirth)}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Age</p>
						<p className="font-medium text-foreground">
							{patient.age} years old
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">
							Phone Number
						</p>
						<p className="font-medium text-foreground">
							{patient.phone || "Not provided"}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">
							Email Address
						</p>
						<p className="font-medium text-foreground">
							{patient.userId.email}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">
							Patient Status
						</p>
						<p className="font-medium text-foreground capitalize">
							{patient.status}
						</p>
					</div>
				</div>
				{patient.address && (
					<div>
						<p className="text-sm text-muted-foreground">Address</p>
						<p className="font-medium text-foreground">
							{patient.address.street}, {patient.address.city},{" "}
							{patient.address.state} {patient.address.zipCode}
						</p>
					</div>
				)}
			</Card>

			{/* Surgery/Procedure Information */}
			<Card className="p-6 space-y-4">
				<h2 className="font-semibold text-lg text-foreground">
					Surgery & Procedure Details
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="space-y-4">
						<div>
							<p className="text-sm text-muted-foreground">
								Procedure Type
							</p>
							<p className="text-lg font-semibold text-foreground">
								{patient.procedure}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">
								Surgery Date
							</p>
							<p className="font-medium text-foreground">
								{formatDate(patient.procedureDate)}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">
								Days Post-Operation
							</p>
							<div className="flex items-center gap-2">
								<p className="text-2xl font-bold text-primary">
									Day {patient.daysPostOp}
								</p>
								<span className="text-xs text-muted-foreground">
									(
									{patient.daysPostOp < 7
										? "Early Recovery"
										: patient.daysPostOp < 30
										? "Active Recovery"
										: patient.daysPostOp < 90
										? "Advanced Recovery"
										: "Long-term Recovery"}
									)
								</span>
							</div>
						</div>
					</div>
					<div className="space-y-4">
						<div>
							<p className="text-sm text-muted-foreground">
								Current Risk Level
							</p>
							<div className="flex items-center gap-2 mt-1">
								<span
									className={`px-3 py-1 rounded-full font-medium text-sm ${
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
							<p className="text-xs text-muted-foreground mt-2">
								{patient.riskLevel === "stable"
									? "Patient is recovering well with no concerning symptoms"
									: patient.riskLevel === "monitor"
									? "Patient requires monitoring - some symptoms detected"
									: "Patient requires immediate attention - critical symptoms detected"}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground mb-2">
								Recovery Progress
							</p>
							<div className="space-y-2">
								<div className="w-full bg-muted rounded-full h-4 overflow-hidden">
									<div
										className={`h-full transition-all ${
											patient.recoveryProgress >= 75
												? "bg-green-500"
												: patient.recoveryProgress >= 50
												? "bg-blue-500"
												: patient.recoveryProgress >= 25
												? "bg-yellow-500"
												: "bg-orange-500"
										}`}
										style={{
											width: `${patient.recoveryProgress}%`,
										}}
									/>
								</div>
								<p className="text-sm font-semibold text-foreground">
									{patient.recoveryProgress}% Complete
								</p>
							</div>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">
								Task Adherence Rate
							</p>
							<div className="space-y-2">
								<div className="w-full bg-muted rounded-full h-4 overflow-hidden">
									<div
										className={`h-full transition-all ${
											patient.adherenceRate >= 80
												? "bg-green-500"
												: patient.adherenceRate >= 60
												? "bg-yellow-500"
												: "bg-red-500"
										}`}
										style={{
											width: `${patient.adherenceRate}%`,
										}}
									/>
								</div>
								<p className="text-sm font-semibold text-foreground">
									{patient.adherenceRate}% Adherence
								</p>
							</div>
						</div>
					</div>
				</div>
			</Card>

			{/* Recovery Timeline */}
			<Card className="p-6 space-y-4">
				<h2 className="font-semibold text-lg text-foreground">
					Recovery Timeline
				</h2>
				<div className="space-y-3">
					<div className="flex items-start gap-3">
						<div
							className={`w-3 h-3 rounded-full mt-1 ${
								patient.daysPostOp >= 0
									? "bg-green-500"
									: "bg-gray-300"
							}`}
						/>
						<div>
							<p className="font-medium text-foreground">
								Surgery Completed
							</p>
							<p className="text-sm text-muted-foreground">
								{formatDate(patient.procedureDate)}
							</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div
							className={`w-3 h-3 rounded-full mt-1 ${
								patient.daysPostOp >= 7
									? "bg-green-500"
									: patient.daysPostOp >= 1
									? "bg-blue-500"
									: "bg-gray-300"
							}`}
						/>
						<div>
							<p className="font-medium text-foreground">
								Week 1 - Initial Recovery
							</p>
							<p className="text-sm text-muted-foreground">
								{patient.daysPostOp >= 7
									? "Completed"
									: `${
											7 - patient.daysPostOp
									  } days remaining`}
							</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div
							className={`w-3 h-3 rounded-full mt-1 ${
								patient.daysPostOp >= 30
									? "bg-green-500"
									: patient.daysPostOp >= 7
									? "bg-blue-500"
									: "bg-gray-300"
							}`}
						/>
						<div>
							<p className="font-medium text-foreground">
								Month 1 - Active Recovery
							</p>
							<p className="text-sm text-muted-foreground">
								{patient.daysPostOp >= 30
									? "Completed"
									: patient.daysPostOp >= 7
									? `${
											30 - patient.daysPostOp
									  } days remaining`
									: "Not yet started"}
							</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div
							className={`w-3 h-3 rounded-full mt-1 ${
								patient.daysPostOp >= 90
									? "bg-green-500"
									: patient.daysPostOp >= 30
									? "bg-blue-500"
									: "bg-gray-300"
							}`}
						/>
						<div>
							<p className="font-medium text-foreground">
								3 Months - Advanced Recovery
							</p>
							<p className="text-sm text-muted-foreground">
								{patient.daysPostOp >= 90
									? "Completed"
									: patient.daysPostOp >= 30
									? `${
											90 - patient.daysPostOp
									  } days remaining`
									: "Not yet started"}
							</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div
							className={`w-3 h-3 rounded-full mt-1 ${
								patient.status === "recovered"
									? "bg-green-500"
									: patient.daysPostOp >= 90
									? "bg-blue-500"
									: "bg-gray-300"
							}`}
						/>
						<div>
							<p className="font-medium text-foreground">
								Full Recovery
							</p>
							<p className="text-sm text-muted-foreground">
								{patient.status === "recovered"
									? "Patient has fully recovered"
									: patient.daysPostOp >= 90
									? "In progress"
									: "Upcoming milestone"}
							</p>
						</div>
					</div>
				</div>
			</Card>
		</div>
	);
}

export default PatientOverview;

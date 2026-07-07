"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PlatformConfiguration() {
	const [activeTab, setActiveTab] = useState<"pathways" | "alerts">(
		"pathways"
	);
	const carePathways = [
		{ id: 1, name: "Orthopedic Surgery", status: "active", duration: 42 },
		{ id: 2, name: "Cardiac Surgery", status: "active", duration: 56 },
		{ id: 3, name: "General Surgery", status: "inactive", duration: 35 },
	];
	const alertThresholds = [
		{
			id: 1,
			metric: "Temperature",
			threshold: 100.4,
			severity: "critical",
			unit: "°F",
		},
		{
			id: 2,
			metric: "Pain Score",
			threshold: 8,
			severity: "critical",
			unit: "/10",
		},
		{
			id: 3,
			metric: "Medication Adherence",
			threshold: 70,
			severity: "warning",
			unit: "%",
		},
	];

	return (
		<div className="p-4 md:p-6 space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-foreground">
					Platform Configuration
				</h1>
				<p className="text-muted-foreground">
					Customize care pathways, alerts, branding, and compliance
					settings
				</p>
			</div>

			<div className="flex gap-2 border-b border-border overflow-x-auto">
				{(["pathways", "alerts"] as const).map((tab) => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab)}
						className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
							activeTab === tab
								? "text-primary border-b-2 border-primary"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						{tab === "pathways" && "Care Pathways"}
						{tab === "alerts" && "Alert Thresholds"}
					</button>
				))}
			</div>

			{activeTab === "pathways" && (
				<div className="space-y-4">
					<div className="flex justify-between items-center">
						<h2 className="text-xl font-semibold text-foreground">
							Care Pathway Configuration
						</h2>
						<Button>Add New Pathway</Button>
					</div>

					<div className="space-y-3">
						{carePathways.map((pathway) => (
							<Card key={pathway.id} className="p-4">
								<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
									<div className="flex-1">
										<h3 className="font-semibold text-foreground mb-1">
											{pathway.name}
										</h3>
										<p className="text-sm text-muted-foreground">
											Duration: {pathway.duration} days
										</p>
										<span
											className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
												pathway.status === "active"
													? "bg-green-100 text-green-800"
													: "bg-gray-100 text-gray-800"
											}`}
										>
											{pathway.status === "active"
												? "Active"
												: "Inactive"}
										</span>
									</div>
									<div className="flex gap-2">
										<Button size="sm" variant="outline">
											Customize Flow
										</Button>
										<Button size="sm" variant="outline">
											Edit
										</Button>
									</div>
								</div>
							</Card>
						))}
					</div>

					<Card className="p-4 bg-accent/5 border-accent/20">
						<p className="text-sm text-foreground">
							Configure the flow, timing, and content of
							reminders, check-ins, and educational delivery for
							each pathway to match your local protocols.
						</p>
					</Card>
				</div>
			)}

			{activeTab === "alerts" && (
				<div className="space-y-4">
					<div className="flex justify-between items-center">
						<h2 className="text-xl font-semibold text-foreground">
							Alert Threshold Management
						</h2>
						<Button>Add New Threshold</Button>
					</div>

					<div className="space-y-3">
						{alertThresholds.map((threshold) => (
							<Card key={threshold.id} className="p-4">
								<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
									<div className="flex-1">
										<h3 className="font-semibold text-foreground mb-1">
											{threshold.metric}
										</h3>
										<div className="grid grid-cols-2 gap-4 text-sm">
											<div>
												<p className="text-muted-foreground">
													Threshold Value
												</p>
												<p className="font-medium text-foreground">
													{threshold.threshold}
													{threshold.unit}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground">
													Severity Level
												</p>
												<span
													className={`inline-block px-2 py-1 rounded text-xs font-medium ${
														threshold.severity ===
														"critical"
															? "bg-red-100 text-red-800"
															: "bg-yellow-100 text-yellow-800"
													}`}
												>
													{threshold.severity ===
													"critical"
														? "Critical"
														: "Warning"}
												</span>
											</div>
										</div>
									</div>
									<Button size="sm" variant="outline">
										Edit Threshold
									</Button>
								</div>
							</Card>
						))}
					</div>

					<Card className="p-4 bg-accent/5 border-accent/20">
						<p className="text-sm text-foreground">
							Define precise numerical thresholds that will
							trigger critical or minor alerts, ensuring the
							system aligns with your specific clinical standards
							of care.
						</p>
					</Card>
				</div>
			)}
		</div>
	);
}

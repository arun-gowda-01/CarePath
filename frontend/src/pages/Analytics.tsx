"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { doctorApi } from "@/lib/api";
import { toast } from "sonner";

// Metric Card Component
function MetricCard({
	label,
	value,
	borderColor,
}: {
	label: string;
	value: number;
	borderColor: string;
}) {
	return (
		<Card className={`p-4 border-l-4 ${borderColor}`}>
			<p className="text-sm text-muted-foreground">{label}</p>
			<p className="text-2xl font-bold text-foreground mt-2">{value}</p>
		</Card>
	);
}

// Risk Distribution Item Component
function RiskDistributionItem({
	status,
	count,
	percentage,
}: {
	status: string;
	count: number;
	percentage: number;
}) {
	const barColor =
		status === "Stable"
			? "bg-green-500"
			: status === "Monitor"
			? "bg-yellow-500"
			: "bg-red-500";

	return (
		<div className="space-y-2">
			<div className="flex justify-between items-center">
				<p className="text-sm font-medium text-foreground">{status}</p>
				<span className="text-sm font-semibold text-foreground">
					{count} patients ({percentage}%)
				</span>
			</div>
			<div className="w-full bg-muted rounded-full h-3 overflow-hidden">
				<div
					className={`h-full transition-all ${barColor}`}
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
}

function Analytics() {
	const [timePeriod, setTimePeriod] = useState<"week" | "month" | "quarter">(
		"month"
	);
	const [loading, setLoading] = useState(true);
	const [analyticsData, setAnalyticsData] = useState<any>(null);
	const [adherenceData, setAdherenceData] = useState<any>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const [analyticsRes, adherenceRes] = await Promise.all([
					doctorApi.getAnalytics(),
					doctorApi.getAdherenceAnalytics(),
				]);

				setAnalyticsData(analyticsRes.data.data);
				setAdherenceData(adherenceRes.data.data);
			} catch (err: unknown) {
				console.error("Error fetching analytics:", err);
				toast.error(
					(err as { response?: { data?: { message?: string } } }).response
						?.data?.message || "Failed to load analytics"
				);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	if (loading) {
		return (
			<div className="p-4 md:p-6">
				<p className="text-muted-foreground">Loading analytics...</p>
			</div>
		);
	}

	if (!analyticsData || !adherenceData) {
		return (
			<div className="p-4 md:p-6">
				<p className="text-red-600">Failed to load analytics data</p>
			</div>
		);
	}

	// Calculate date range based on time period
	const now = new Date();
	const startDate = new Date();
	if (timePeriod === "week") {
		startDate.setDate(now.getDate() - 7);
	} else if (timePeriod === "month") {
		startDate.setMonth(now.getMonth() - 1);
	} else {
		startDate.setMonth(now.getMonth() - 3);
	}

	const data = {
		adherence: adherenceData.summary?.avgAdherence || 0,
		adherenceTrend: 0, // Can be calculated from historical data
		totalPatients: analyticsData.totalAssignedPatients || 0,
		recoveredPatients: analyticsData.assignedPatients?.filter(
			(p: any) => p.status === "recovered"
		).length || 0,
		activeAlerts: analyticsData.activeAlerts || 0,
		completedCheckIns: 0, // Can be calculated from check-ins
	};

	// Group patients by procedure and calculate metrics
	const procedureMap = new Map<string, any[]>();
	(analyticsData.assignedPatients || []).forEach((patient: any) => {
		const proc = patient.procedure || "Other";
		if (!procedureMap.has(proc)) {
			procedureMap.set(proc, []);
		}
		procedureMap.get(proc)!.push(patient);
	});

	const procedureMetrics = Array.from(procedureMap.entries()).map(
		([name, patients]) => {
			const avgAdherence =
				patients.reduce((sum, p) => sum + (p.adherence || 0), 0) /
				patients.length;
			return {
				name,
				patients: patients.length,
				avgRecoveryDays: 0, // Can be calculated from procedureDate
				adherence: Math.round(avgAdherence),
				satisfaction: 0, // Not tracked currently
			};
		}
	);

	const riskDistribution = analyticsData.riskDistribution
		? [
				{
					status: "Stable",
					count: analyticsData.riskDistribution.stable || 0,
					percentage:
						analyticsData.totalAssignedPatients > 0
							? Math.round(
									((analyticsData.riskDistribution.stable || 0) /
										analyticsData.totalAssignedPatients) *
										100
							  )
							: 0,
				},
				{
					status: "Monitor",
					count: analyticsData.riskDistribution.monitor || 0,
					percentage:
						analyticsData.totalAssignedPatients > 0
							? Math.round(
									((analyticsData.riskDistribution.monitor || 0) /
										analyticsData.totalAssignedPatients) *
										100
							  )
							: 0,
				},
				{
					status: "Critical",
					count: analyticsData.riskDistribution.critical || 0,
					percentage:
						analyticsData.totalAssignedPatients > 0
							? Math.round(
									((analyticsData.riskDistribution.critical || 0) /
										analyticsData.totalAssignedPatients) *
										100
							  )
							: 0,
				},
		  ]
		: [];

	const timePeriods = ["week", "month", "quarter"] as const;

	return (
		<div className="p-4 md:p-6 space-y-6">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold text-foreground">
						Analytics & Reporting
					</h1>
					<p className="text-muted-foreground">
						Key performance indicators and insights
					</p>
				</div>
				<div className="flex gap-2">
					{timePeriods.map((period) => (
						<Button
							key={period}
							variant={
								timePeriod === period ? "default" : "outline"
							}
							size="sm"
							onClick={() => setTimePeriod(period)}
						>
							{period.charAt(0).toUpperCase() + period.slice(1)}
						</Button>
					))}
				</div>
			</div>

			{/* Secondary Metrics */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<MetricCard
					label="Total Patients"
					value={data.totalPatients}
					borderColor="border-l-blue-500"
				/>
				<MetricCard
					label="Recovered"
					value={data.recoveredPatients}
					borderColor="border-l-green-500"
				/>
				<MetricCard
					label="Active Alerts"
					value={data.activeAlerts}
					borderColor="border-l-red-500"
				/>
				<MetricCard
					label="Avg Adherence"
					value={data.adherence}
					borderColor="border-l-purple-500"
				/>
			</div>

			{/* Adherence Summary */}
			{adherenceData.summary && (
				<Card className="p-6 space-y-4">
					<h2 className="font-semibold text-lg text-foreground">
						Adherence Overview
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<p className="text-sm text-muted-foreground">
								Overall Adherence
							</p>
							<p className="text-2xl font-bold text-foreground">
								{adherenceData.summary.avgAdherence}%
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">
								Task Adherence
							</p>
							<p className="text-2xl font-bold text-foreground">
								{adherenceData.summary.avgTaskAdherence}%
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">
								Medication Adherence
							</p>
							<p className="text-2xl font-bold text-foreground">
								{adherenceData.summary.avgMedicationAdherence}%
							</p>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
						<div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
							<p className="text-sm text-muted-foreground">
								Excellent (≥90%)
							</p>
							<p className="text-xl font-bold text-green-600">
								{adherenceData.summary.excellentAdherence}
							</p>
						</div>
						<div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
							<p className="text-sm text-muted-foreground">
								Good (75-89%)
							</p>
							<p className="text-xl font-bold text-yellow-600">
								{adherenceData.summary.goodAdherence}
							</p>
						</div>
						<div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
							<p className="text-sm text-muted-foreground">
								Needs Attention (&lt;75%)
							</p>
							<p className="text-xl font-bold text-red-600">
								{adherenceData.summary.needsAttention}
							</p>
						</div>
					</div>
				</Card>
			)}

			{/* Risk Distribution */}
			<Card className="p-6 space-y-4">
				<h2 className="font-semibold text-lg text-foreground">
					Patient Risk Distribution
				</h2>
				<div className="space-y-3">
					{riskDistribution.map((item, idx) => (
						<RiskDistributionItem key={idx} {...item} />
					))}
				</div>
			</Card>

			{/* Procedure Metrics */}
			<Card className="p-6 space-y-4">
				<h2 className="font-semibold text-lg text-foreground">
					Performance by Procedure Type
				</h2>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border">
								<th className="text-left py-3 px-4 font-semibold text-foreground">
									Procedure
								</th>
								<th className="text-left py-3 px-4 font-semibold text-foreground">
									Patients
								</th>
								<th className="text-left py-3 px-4 font-semibold text-foreground">
									Avg Recovery
								</th>
								<th className="text-left py-3 px-4 font-semibold text-foreground">
									Adherence
								</th>
								<th className="text-left py-3 px-4 font-semibold text-foreground">
									Satisfaction
								</th>
							</tr>
						</thead>
						<tbody>
							{procedureMetrics.map((proc, idx) => (
								<tr
									key={idx}
									className="border-b border-border hover:bg-muted/50 transition-colors"
								>
									<td className="py-3 px-4 font-medium text-foreground">
										{proc.name}
									</td>
									<td className="py-3 px-4 text-muted-foreground">
										{proc.patients}
									</td>
									<td className="py-3 px-4 text-muted-foreground">
										{proc.avgRecoveryDays} days
									</td>
									<td className="py-3 px-4">
										<div className="flex items-center gap-2">
											<div className="w-16 bg-muted rounded-full h-2 overflow-hidden">
												<div
													className="bg-primary h-full"
													style={{
														width: `${proc.adherence}%`,
													}}
												/>
											</div>
											<span className="text-sm font-medium text-foreground">
												{proc.adherence}%
											</span>
										</div>
									</td>
									<td className="py-3 px-4">
										<span className="text-sm font-medium text-foreground">
											{proc.satisfaction}%
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</Card>
		</div>
	);
}

export default Analytics;

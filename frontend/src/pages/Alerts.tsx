import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatDate";
import { alertApi } from "@/lib/api";
import type { Alert as AlertType } from "@/lib/types";

function Alerts() {
	const navigate = useNavigate();
	const [filterStatus, setFilterStatus] = useState<string | null>(null);
	const [alerts, setAlerts] = useState<AlertType[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch alerts on component mount
	useEffect(() => {
		fetchAlerts();
	}, []);

	const fetchAlerts = async () => {
		try {
			setLoading(true);
			setError(null);
			// Fetch alerts without including viewed ones (they'll be filtered by backend)
			const response = await alertApi.getAllAlerts({
				includeViewed: "false",
			});
			setAlerts(response.data.data.alerts || []);
		} catch (err: any) {
			console.error("Error fetching alerts:", err);
			setError(err.response?.data?.message || "Failed to load alerts");
		} finally {
			setLoading(false);
		}
	};

	const markAsViewed = async (alertId: string) => {
		try {
			// Mark the alert as viewed
			await alertApi.markAsViewed(alertId);
			// Remove the alert from the UI immediately (notification behavior)
			setAlerts((prevAlerts) =>
				prevAlerts.filter((a) => a._id !== alertId)
			);
		} catch (err: any) {
			console.error("Error marking alert as viewed:", err);
		}
	};

	const resolveAlert = async (alertId: string) => {
		try {
			await alertApi.updateAlertStatus(alertId, { status: "resolved" });
			// Refresh alerts
			fetchAlerts();
		} catch (err: any) {
			console.error("Error resolving alert:", err);
		}
	};

	const handleViewPatient = (patientId: string) => {
		// Navigate to patient profile with patient ID
		navigate(`/doctor/patient-profile/${patientId}`);
	};

	let filteredAlerts = alerts;
	if (filterStatus) {
		filteredAlerts = filteredAlerts.filter(
			(a) => a.status === filterStatus
		);
	}

	const stats = {
		active: alerts.filter((a) => a.status === "active").length,
		dismissed: alerts.filter((a) => a.status === "dismissed").length,
		resolved: alerts.filter((a) => a.status === "resolved").length,
	};

	const statusFilters = [
		{ value: null, label: "All Alerts", variant: "default" as const },
		{
			value: "active",
			label: "Active",
			variant: "default" as const,
			color: "red",
		},
		{
			value: "dismissed",
			label: "Dismissed",
			variant: "default" as const,
			color: "blue",
		},
		{
			value: "resolved",
			label: "Resolved",
			variant: "default" as const,
			color: "green",
		},
	];

	// Get patient name from alert
	const getPatientName = (alert: AlertType) => {
		if (typeof alert.patientId === "object" && alert.patientId?.userId) {
			const userId = alert.patientId.userId as any;
			return (
				`${userId.firstName || ""} ${userId.lastName || ""}`.trim() ||
				"Patient"
			);
		}
		return "Patient";
	};

	// Get patient ID string
	const getPatientId = (alert: AlertType): string => {
		if (typeof alert.patientId === "object") {
			return alert.patientId._id;
		}
		return alert.patientId;
	};

	return (
		<div className="p-4 md:p-6 space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-foreground">
					Patient Alerts
				</h1>
				<p className="text-muted-foreground">
					Monitor alerts for your assigned patients
				</p>
			</div>

			{/* Filters */}
			<Card className="p-4 space-y-4">
				<div className="flex flex-col md:flex-row gap-4">
					<div className="flex gap-2 flex-wrap">
						{statusFilters.map((filter) => (
							<Button
								key={filter.label}
								variant={
									filterStatus === filter.value
										? "default"
										: "outline"
								}
								size="sm"
								onClick={() => setFilterStatus(filter.value)}
								className={
									filterStatus === filter.value &&
									filter.color === "red"
										? "bg-red-500 hover:bg-red-600 text-white"
										: filterStatus === filter.value &&
										  filter.color === "blue"
										? "bg-blue-500 hover:bg-blue-600 text-white"
										: filterStatus === filter.value &&
										  filter.color === "green"
										? "bg-green-500 hover:bg-green-600 text-white"
										: filter.color === "red"
										? "hover:bg-red-50"
										: filter.color === "blue"
										? "hover:bg-blue-50"
										: filter.color === "green"
										? "hover:bg-green-50"
										: ""
								}
							>
								{filter.label}
							</Button>
						))}
					</div>
				</div>
			</Card>

			{/* Loading/Error States */}
			{loading && (
				<div className="text-center py-8">
					<p className="text-muted-foreground">Loading alerts...</p>
				</div>
			)}

			{error && (
				<Card className="p-4 bg-red-50 border-red-200">
					<p className="text-red-800">{error}</p>
					<Button
						size="sm"
						variant="outline"
						onClick={fetchAlerts}
						className="mt-2"
					>
						Retry
					</Button>
				</Card>
			)}

			{/* Alerts List */}
			{!loading && !error && (
				<div className="space-y-3">
					{filteredAlerts.length > 0 ? (
						filteredAlerts.map((alert) => (
							<Card
								key={alert._id}
								className={`p-4 border-l-4 ${
									alert.status === "active"
										? "border-l-red-500 bg-red-50"
										: alert.status === "dismissed"
										? "border-l-blue-500 bg-blue-50"
										: "border-l-green-500 bg-green-50"
								}`}
							>
								<div className="space-y-3">
									<div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-2">
												<p className="font-semibold text-foreground text-lg">
													{getPatientName(alert)}
												</p>
												<Badge
													variant="outline"
													className={`${
														alert.status ===
														"active"
															? "bg-red-200 text-red-800"
															: alert.status ===
															  "dismissed"
															? "bg-blue-200 text-blue-800"
															: "bg-green-200 text-green-800"
													}`}
												>
													{alert.status
														.charAt(0)
														.toUpperCase() +
														alert.status.slice(1)}
												</Badge>
											</div>
											<p className="text-sm text-foreground mb-1">
												{alert.message}
											</p>
											<p className="text-xs text-muted-foreground">
												{formatDate(alert.createdAt)}
											</p>
										</div>
									</div>

									{/* Action Buttons */}
									<div className="flex flex-wrap gap-2">
										<Button
											size="sm"
											variant="default"
											onClick={() => {
												markAsViewed(alert._id);
												handleViewPatient(
													getPatientId(alert)
												);
											}}
										>
											View Patient Details
										</Button>
										<Button
											size="sm"
											variant="outline"
											onClick={() =>
												markAsViewed(alert._id)
											}
										>
											Dismiss
										</Button>
										{alert.status === "active" && (
											<Button
												size="sm"
												variant="secondary"
												onClick={() => {
													resolveAlert(alert._id);
													markAsViewed(alert._id);
												}}
											>
												Resolve
											</Button>
										)}
									</div>
								</div>
							</Card>
						))
					) : (
						<div className="text-center py-8">
							<p className="text-muted-foreground">
								No alerts found
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default Alerts;

import Task from "../models/Task.js";
import Medication from "../models/Medication.js";
import type { ITask } from "../models/Task.js";
import type { IMedication } from "../models/Medication.js";

interface AdherenceMetrics {
	overallAdherence: number;
	taskAdherence: number;
	medicationAdherence: number;
	taskDetails: {
		totalTasks: number;
		completedTasks: number;
		onTimeTasks: number;
		overdueTasks: number;
	};
	medicationDetails: {
		totalExpectedDoses: number;
		totalTakenDoses: number;
		onTimeDoses: number;
		missedDoses: number;
	};
}

/**
 * Calculate medication adherence for a patient
 * Adherence is based on doses taken on time vs expected doses
 */
export async function calculateMedicationAdherence(
	patientId: string,
	startDate?: Date,
	endDate?: Date
): Promise<{
	adherenceRate: number;
	totalExpectedDoses: number;
	totalTakenDoses: number;
	onTimeDoses: number;
	missedDoses: number;
}> {
	const medications = await Medication.find({
		patientId,
		isActive: true,
	});

	if (medications.length === 0) {
		return {
			adherenceRate: 100, // No medications = perfect adherence
			totalExpectedDoses: 0,
			totalTakenDoses: 0,
			onTimeDoses: 0,
			missedDoses: 0,
		};
	}

	const now = new Date();
	const start = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
	const end = endDate || now;

	let totalExpectedDoses = 0;
	let totalTakenDoses = 0;
	let onTimeDoses = 0;
	let missedDoses = 0;

	for (const medication of medications) {
		const medStart = medication.startDate > start ? medication.startDate : start;
		const medEnd = medication.endDate
			? medication.endDate < end
				? medication.endDate
				: end
			: end;

		// Calculate expected doses for each day
		const daysDiff = Math.ceil(
			(medEnd.getTime() - medStart.getTime()) / (1000 * 60 * 60 * 24)
		);

		// Expected doses = number of timings per day * number of days
		const dosesPerDay = medication.timings.length;
		const expectedForThisMed = daysDiff * dosesPerDay;
		totalExpectedDoses += expectedForThisMed;

		// Count actual doses taken within the date range
		const dosesInRange = medication.dosesTaken.filter((dose) => {
			const doseDate = new Date(dose.date);
			return doseDate >= medStart && doseDate <= medEnd;
		});

		totalTakenDoses += dosesInRange.length;

		// Count on-time doses (taken on the same day, within reasonable time window)
		// For simplicity, we consider a dose "on-time" if taken on the correct day
		// A more sophisticated version could check if taken within 2 hours of scheduled time
		for (const dose of dosesInRange) {
			const doseDate = new Date(dose.date);
			const expectedTimings = medication.timings.map((t) => t.timeOfDay);

			// Check if this dose matches an expected timing for that day
			if (expectedTimings.includes(dose.timeOfDay)) {
				onTimeDoses++;
			}
		}
	}

	missedDoses = totalExpectedDoses - totalTakenDoses;
	const adherenceRate =
		totalExpectedDoses > 0
			? Math.round((onTimeDoses / totalExpectedDoses) * 100)
			: 100;

	return {
		adherenceRate,
		totalExpectedDoses,
		totalTakenDoses,
		onTimeDoses,
		missedDoses,
	};
}

/**
 * Calculate task adherence for a patient
 */
export async function calculateTaskAdherence(
	patientId: string,
	startDate?: Date,
	endDate?: Date
): Promise<{
	adherenceRate: number;
	totalTasks: number;
	completedTasks: number;
	onTimeTasks: number;
	overdueTasks: number;
}> {
	const query: any = { patientId };

	if (startDate || endDate) {
		query.scheduledTime = {};
		if (startDate) query.scheduledTime.$gte = startDate;
		if (endDate) query.scheduledTime.$lte = endDate;
	}

	const tasks = await Task.find(query);

	if (tasks.length === 0) {
		return {
			adherenceRate: 100, // No tasks = perfect adherence
			totalTasks: 0,
			completedTasks: 0,
			onTimeTasks: 0,
			overdueTasks: 0,
		};
	}

	const totalTasks = tasks.length;
	const completedTasks = tasks.filter((t) => t.completed).length;

	// On-time tasks: completed before or on scheduled time
	const now = new Date();
	const onTimeTasks = tasks.filter((task) => {
		if (!task.completed) return false;
		const scheduledTime = new Date(task.scheduledTime);
		const completedAt = task.completedAt
			? new Date(task.completedAt)
			: scheduledTime;
		// Allow 24 hours grace period for "on-time"
		return completedAt <= new Date(scheduledTime.getTime() + 24 * 60 * 60 * 1000);
	}).length;

	// Overdue tasks: not completed and past scheduled time
	const overdueTasks = tasks.filter((task) => {
		if (task.completed) return false;
		const scheduledTime = new Date(task.scheduledTime);
		return scheduledTime < now;
	}).length;

	const adherenceRate =
		totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

	return {
		adherenceRate,
		totalTasks,
		completedTasks,
		onTimeTasks,
		overdueTasks,
	};
}

/**
 * Calculate comprehensive adherence metrics combining tasks and medications
 */
export async function calculateComprehensiveAdherence(
	patientId: string,
	startDate?: Date,
	endDate?: Date
): Promise<AdherenceMetrics> {
	const [taskMetrics, medicationMetrics] = await Promise.all([
		calculateTaskAdherence(patientId, startDate, endDate),
		calculateMedicationAdherence(patientId, startDate, endDate),
	]);

	// Calculate overall adherence as weighted average
	// Weight: 50% tasks, 50% medications (can be adjusted)
	const taskWeight = 0.5;
	const medicationWeight = 0.5;

	const overallAdherence = Math.round(
		taskMetrics.adherenceRate * taskWeight +
			medicationMetrics.adherenceRate * medicationWeight
	);

	return {
		overallAdherence,
		taskAdherence: taskMetrics.adherenceRate,
		medicationAdherence: medicationMetrics.adherenceRate,
		taskDetails: {
			totalTasks: taskMetrics.totalTasks,
			completedTasks: taskMetrics.completedTasks,
			onTimeTasks: taskMetrics.onTimeTasks,
			overdueTasks: taskMetrics.overdueTasks,
		},
		medicationDetails: {
			totalExpectedDoses: medicationMetrics.totalExpectedDoses,
			totalTakenDoses: medicationMetrics.totalTakenDoses,
			onTimeDoses: medicationMetrics.onTimeDoses,
			missedDoses: medicationMetrics.missedDoses,
		},
	};
}


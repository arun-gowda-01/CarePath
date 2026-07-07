import { z } from "zod";

export const addPatientSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.email("Invalid email address"),
	password: z.string().min(6, "Password must be at least 6 characters"),
	dateOfBirth: z.coerce.date(),
	phone: z.string().optional(),
	address: z
		.object({
			street: z.string().optional(),
			city: z.string().optional(),
			state: z.string().optional(),
			zipCode: z.string().optional(),
		})
		.optional(),
	procedure: z.string().min(1, "Procedure is required"),
	procedureDate: z.coerce.date(),
	riskLevel: z.enum(["stable", "monitor", "critical"]).optional(),
});

export const updatePatientSchema = z.object({
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	phone: z.string().optional(),
	address: z
		.object({
			street: z.string().optional(),
			city: z.string().optional(),
			state: z.string().optional(),
			zipCode: z.string().optional(),
		})
		.optional(),
	dateOfBirth: z.coerce.date().optional(),
	procedure: z.string().optional(),
	procedureDate: z.coerce.date().optional(),
	riskLevel: z.enum(["stable", "monitor", "critical"]).optional(),
	adherenceRate: z.number().min(0).max(100).optional(),
	recoveryProgress: z.number().min(0).max(100).optional(),
	status: z.enum(["active", "recovered"]).optional(),
});

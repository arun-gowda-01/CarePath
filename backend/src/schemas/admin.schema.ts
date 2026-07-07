import { z } from "zod";

export const registerAdminSchema = z.object({
	email: z.email(),
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	password: z.string().min(6, "Password must be at least 6 characters long"),
});

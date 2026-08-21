import { z } from "zod";
export declare const registerAdminSchema: z.ZodObject<{
    email: z.ZodEmail;
    firstName: z.ZodString;
    lastName: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;

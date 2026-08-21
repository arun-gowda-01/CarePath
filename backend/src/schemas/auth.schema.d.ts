import z from "zod";
export declare const loginSchema: z.ZodObject<{
    email: z.ZodEmail;
    password: z.ZodString;
    role: z.ZodEnum<{
        patient: "patient";
        doctor: "doctor";
        admin: "admin";
    }>;
}, z.core.$strip>;

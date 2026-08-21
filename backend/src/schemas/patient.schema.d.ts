import { z } from "zod";
export declare const addPatientSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodEmail;
    password: z.ZodString;
    dateOfBirth: z.ZodCoercedDate<unknown>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodObject<{
        street: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodString>;
        zipCode: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    procedure: z.ZodString;
    procedureDate: z.ZodCoercedDate<unknown>;
    riskLevel: z.ZodOptional<z.ZodEnum<{
        stable: "stable";
        monitor: "monitor";
        critical: "critical";
    }>>;
}, z.core.$strip>;
export declare const updatePatientSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodObject<{
        street: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodString>;
        zipCode: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    dateOfBirth: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    procedure: z.ZodOptional<z.ZodString>;
    procedureDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    riskLevel: z.ZodOptional<z.ZodEnum<{
        stable: "stable";
        monitor: "monitor";
        critical: "critical";
    }>>;
    adherenceRate: z.ZodOptional<z.ZodNumber>;
    recoveryProgress: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        recovered: "recovered";
    }>>;
}, z.core.$strip>;

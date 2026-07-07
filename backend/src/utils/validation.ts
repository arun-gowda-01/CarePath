import { ApiError } from "./apiError.js";

export interface ValidationRule {
	field: string;
	value: any;
	rules: {
		required?: boolean;
		type?:
			| "string"
			| "number"
			| "email"
			| "date"
			| "boolean"
			| "object"
			| "array";
		min?: number;
		max?: number;
		minLength?: number;
		maxLength?: number;
		enum?: any[];
		pattern?: RegExp;
		custom?: (value: any) => boolean;
		customMessage?: string;
	};
}

export class Validator {
	private errors: string[] = [];

	validate(validationRules: ValidationRule[]): void {
		this.errors = [];

		for (const rule of validationRules) {
			this.validateField(rule);
		}

		if (this.errors.length > 0) {
			throw new ApiError(this.errors.join(", "), 400);
		}
	}

	private validateField(rule: ValidationRule): void {
		const { field, value, rules } = rule;

		// Required check
		if (
			rules.required &&
			(value === undefined || value === null || value === "")
		) {
			this.errors.push(`${field} is required`);
			return;
		}

		// If not required and value is empty, skip other validations
		if (
			!rules.required &&
			(value === undefined || value === null || value === "")
		) {
			return;
		}

		// Type check
		if (rules.type) {
			if (rules.type === "email") {
				if (!this.isValidEmail(value)) {
					this.errors.push(`${field} must be a valid email address`);
				}
			} else if (rules.type === "date") {
				if (!(value instanceof Date) && isNaN(Date.parse(value))) {
					this.errors.push(`${field} must be a valid date`);
				}
			} else if (rules.type === "array") {
				if (!Array.isArray(value)) {
					this.errors.push(`${field} must be an array`);
				}
			} else if (rules.type === "object") {
				if (typeof value !== "object" || Array.isArray(value)) {
					this.errors.push(`${field} must be an object`);
				}
			} else if (typeof value !== rules.type) {
				this.errors.push(`${field} must be of type ${rules.type}`);
			}
		}

		// Number validations
		if (typeof value === "number") {
			if (rules.min !== undefined && value < rules.min) {
				this.errors.push(`${field} must be at least ${rules.min}`);
			}
			if (rules.max !== undefined && value > rules.max) {
				this.errors.push(`${field} must be at most ${rules.max}`);
			}
		}

		// String validations
		if (typeof value === "string") {
			if (
				rules.minLength !== undefined &&
				value.length < rules.minLength
			) {
				this.errors.push(
					`${field} must be at least ${rules.minLength} characters long`
				);
			}
			if (
				rules.maxLength !== undefined &&
				value.length > rules.maxLength
			) {
				this.errors.push(
					`${field} must be at most ${rules.maxLength} characters long`
				);
			}
			if (rules.pattern && !rules.pattern.test(value)) {
				this.errors.push(
					rules.customMessage || `${field} format is invalid`
				);
			}
		}

		// Enum validation
		if (rules.enum && !rules.enum.includes(value)) {
			this.errors.push(
				`${field} must be one of: ${rules.enum.join(", ")}`
			);
		}

		// Custom validation
		if (rules.custom && !rules.custom(value)) {
			this.errors.push(
				rules.customMessage || `${field} validation failed`
			);
		}
	}

	private isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}
}

export const validateRequest = (validationRules: ValidationRule[]): void => {
	const validator = new Validator();
	validator.validate(validationRules);
};

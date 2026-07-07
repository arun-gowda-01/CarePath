import { NextFunction, Request, Response } from "express";
import { ApiError } from "./apiError.js";
import z, { ZodError } from "zod";

const asyncHandler =
	(requestHandler: Function) =>
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			await requestHandler(req, res, next);
		} catch (error: unknown) {
			if (process.env.NODE_ENV === "development") {
				console.log(error);
			}

			if (error instanceof ZodError) {
				const flattened = z.flattenError(error);

				return res.sendResponse({
					statusCode: 400,
					success: false,
					message: "Validation Error",
					data: null,
					error: flattened.fieldErrors,
				});
			}

			if (error instanceof ApiError) {
				return res.sendResponse({
					statusCode: error.statusCode,
					success: false,
					message: error.message,
					error: error.stack,
					data: null,
				});
			}

			console.log(error);
			return res.sendResponse({
				statusCode: 500,
				success: false,
				message: "Internal Server Error",
				data: null,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	};

export default asyncHandler;

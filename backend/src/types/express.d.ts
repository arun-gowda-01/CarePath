import { ApiResponse } from "../middlewares/apiResponseHandler.middleware.js";

declare global {
	namespace Express {
		interface Response {
			sendResponse: (response: ApiResponse) => void;
		}
		interface Request {
			user?: {
				id: string;
				email: string;
				role: "admin" | "doctor" | "patient";
				name: string;
			};
		}
	}
}

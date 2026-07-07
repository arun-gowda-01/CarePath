import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const token = req.cookies.authToken;

	if (!token) {
		return res.status(401).json({
			statusCode: 401,
			success: false,
			message: "Unauthorized: No token provided",
		});
	}

	try {
		const decoded = jwt.verify(
			token,
			process.env.JWT_SECRET!
		) as jwt.JwtPayload;
		req.user = {
			id: decoded.id,
			email: decoded.email,
			role: decoded.role,
			name: decoded.name,
		};
		next();
	} catch (err) {
		return res.status(401).json({
			statusCode: 401,
			success: false,
			message: "Unauthorized: Invalid token",
		});
	}
};

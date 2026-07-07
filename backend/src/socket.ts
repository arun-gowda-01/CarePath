import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

interface AuthUser {
	id: string;
	email: string;
	role: string;
	name: string;
}

let io: Server | null = null;

const parseCookie = (cookieHeader: string): Record<string, string> => {
	return cookieHeader.split(";").reduce((acc, part) => {
		const [key, value] = part.split("=");
		if (key && value) {
			acc[key.trim()] = decodeURIComponent(value.trim());
		}
		return acc;
	}, {} as Record<string, string>);
};

export const initSocket = (server: HttpServer) => {
	io = new Server(server, {
		cors: {
			origin: process.env.FRONTEND_URL,
			credentials: true,
		},
	});

	io.use((socket: Socket, next) => {
		try {
			const cookieHeader = socket.handshake.headers.cookie;
			if (!cookieHeader) {
				return next(new Error("Unauthorized"));
			}

			const cookies = parseCookie(cookieHeader);
			const token = cookies["authToken"];

			if (!token) {
				return next(new Error("Unauthorized"));
			}

			const decoded = jwt.verify(
				token,
				process.env.JWT_SECRET as string
			) as jwt.JwtPayload;

			(socket.data as { user?: AuthUser }).user = {
				id: decoded.id as string,
				email: decoded.email as string,
				role: decoded.role as string,
				name: decoded.name as string,
			};

			return next();
		} catch (error) {
			return next(new Error("Unauthorized"));
		}
	});

	io.on("connection", (socket: Socket) => {
		const user = (socket.data as { user?: AuthUser }).user;

		if (!user) {
			socket.disconnect(true);
			return;
		}

		socket.join(user.id);
	});

	return io;
};

export const getIO = (): Server => {
	if (!io) {
		throw new Error("Socket.io not initialized");
	}
	return io;
};

import { io, Socket } from "socket.io-client";
import api from "./api";

let socket: Socket | null = null;

const getBaseSocketUrl = () => {
	// api.defaults.baseURL is like http://localhost:8000/api/v1
	const base = api.defaults.baseURL || "";
	try {
		const url = new URL(base);
		url.pathname = "";
		return url.toString();
	} catch {
		return base.replace(/\/api\/?v1?$/, "");
	}
};

export const getSocket = (): Socket => {
	if (!socket) {
		const url = getBaseSocketUrl();
		socket = io(url, {
			withCredentials: true,
			transports: ["websocket"],
		});
	}
	return socket;
};

export const disconnectSocket = () => {
	if (socket) {
		socket.disconnect();
		socket = null;
	}
};

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV?: "development" | "production" | "test";
			PORT?: string;
			MONGODB_URI: string;
			FRONTEND_URL?: string;
		}
	}
}

export {};

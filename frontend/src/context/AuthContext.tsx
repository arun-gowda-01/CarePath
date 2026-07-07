import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import { authApi } from "../lib/api";
import type { User } from "../lib/types";

interface AuthContextType {
	user: User | null;
	loading: boolean;
	setUser: (user: User | null) => void;
	refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState<boolean>(true);

	const fetchUser = async () => {
		try {
			const { data } = await authApi.getCurrentUser();
			if (data.success) setUser(data.data);
		} catch (err: unknown) {
			setUser(null);
		} finally {
			setLoading(false);
		}
	};

	const PUBLIC_ROUTES = ["/login", "/access-denied"];

	useEffect(() => {
		const currentPath = window.location.pathname;

		const isPublicRoute = PUBLIC_ROUTES.includes(currentPath);

		if (isPublicRoute) {
			setLoading(false);
		} else {
			fetchUser();
		}
	}, []);

	return (
		<AuthContext.Provider
			value={{ user, loading, setUser, refetchUser: fetchUser }}
		>
			{children}
		</AuthContext.Provider>
	);
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

import { type ReactNode } from "react";
import type { User } from "../lib/types";
interface AuthContextType {
    user: User | null;
    loading: boolean;
    setUser: (user: User | null) => void;
    refetchUser: () => Promise<void>;
}
interface AuthProviderProps {
    children: ReactNode;
}
export declare const AuthProvider: ({ children }: AuthProviderProps) => import("react/jsx-runtime").JSX.Element;
export declare const useAuth: () => AuthContextType;
export {};

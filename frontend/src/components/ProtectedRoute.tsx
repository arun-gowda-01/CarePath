import { useAuth } from "@/context/AuthContext";
import { Navigate} from "react-router";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
	const { user, loading } = useAuth();

	if (loading) return <div>Loading...</div>;

	if (!user) return <Navigate to="/login" replace />;

	if (roles && (!user.role || !roles.includes(user.role!)))
		return <Navigate to="/access-denied" replace />;

	return children;
};

export default ProtectedRoute;

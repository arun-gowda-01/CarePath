import PatientHeader from "@/components/PatientHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Outlet } from "react-router";

function PatientLayout() {
	return (
		<div>
			<ProtectedRoute roles={["patient"]}>
				<PatientHeader />
				<Outlet />
			</ProtectedRoute>
		</div>
	);
}

export default PatientLayout;

import { useState } from "react";
import { Outlet } from "react-router";
import DoctorSidebar from "@/components/DoctorSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";

function DoctorLayout() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<div>
			<ProtectedRoute roles={["doctor"]}>
				<div className="flex h-screen">
					<DoctorSidebar
						mobileMenuOpen={mobileMenuOpen}
						setMobileMenuOpen={setMobileMenuOpen}
					/>
					<main className="flex-1 overflow-y-auto">
						<Outlet />
					</main>
				</div>
			</ProtectedRoute>
		</div>
	);
}

export default DoctorLayout;

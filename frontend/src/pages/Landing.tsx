import FeatureTabs from "@/components/FeatureTabs";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Outcomes from "@/components/Outcomes";
import PlatformFeatures from "@/components/PlatformFeatures";
import Roles from "@/components/Roles";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

export default function Landing() {
	const { user } = useAuth();
	const navigate = useNavigate();

	const getDashboardLink = () => {
		if (!user?.role) return null;
		if (user.role.toUpperCase() === "PATIENT")
			return { label: "Go to Patient Home", path: "/patient/home" };
		if (user.role.toUpperCase() === "DOCTOR")
			return {
				label: "Go to Doctor Dashboard",
				path: "/doctor/dashboard",
			};
		if (user.role.toUpperCase() === "ADMIN")
			return {
				label: "Go to User Management",
				path: "/admin/user-management",
			};
		return null;
	};

	const dashboardLink = getDashboardLink();

	return (
		<div className="bg-white text-gray-800 antialiased">
			<Header />
			<main>
				{dashboardLink && (
					<section className="border-b bg-primary/5 border-primary/10">
						<div className="max-w-6xl mx-auto px-4 py-4 md:px-8 md:py-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<p className="text-sm text-muted-foreground">
								You are already logged in as
								<span className="font-semibold text-foreground">
									{user?.name ? ` ${user.name}` : ""}
								</span>
								.
							</p>
							<div className="flex gap-2">
								<Button
									size="sm"
									onClick={() => navigate(dashboardLink.path)}
								>
									{dashboardLink.label}
								</Button>
							</div>
						</div>
					</section>
				)}
				<Hero />
				<div className="h-80 bg-linear-to-b from-gray-50 to-primary/20 backdrop-blur-3xl"></div>
				<Outcomes />
				<div className="h-80 bg-linear-to-b from-primary/20 to-gray-50 backdrop-blur-3xl"></div>
				<Roles />
				<div className="h-80 bg-linear-to-b from-gray-50 to-primary/30 backdrop-blur-3xl"></div>
				<PlatformFeatures />
				{/* <div className="h-80 bg-linear-to-b from-primary/30 to-gray-50 backdrop-blur-3xl"></div> */}
				{/* <FeatureTabs /> */}
			</main>
			<Footer />
		</div>
	);
}

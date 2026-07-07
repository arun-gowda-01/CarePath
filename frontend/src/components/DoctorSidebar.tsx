import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { NavLink, useNavigate } from "react-router";
import { toast } from "sonner";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

interface DoctorSidebarProps {
	mobileMenuOpen: boolean;
	setMobileMenuOpen: (open: boolean) => void;
}

function DoctorSidebar({
	mobileMenuOpen,
	setMobileMenuOpen,
}: DoctorSidebarProps) {
	const { setUser } = useAuth();
	const navigate = useNavigate();

	const doctorRoutes = [
		"dashboard",
		"patient-profile",
		"alerts",
		"analytics",
	];

	const formatLabel = (route: string) => {
		return route
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	};

	const handleLogout = async () => {
		try {
			await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/auth/logout`,
				{},
				{ withCredentials: true }
			);
			setUser(null);
			toast.success("Logged out successfully");
			navigate("/login");
		} catch (error) {
			console.error("Logout failed:", error);
			toast.error("Logout failed");
		}
	};

	return (
		<>
			{/* Mobile Menu Button */}
			<button
				onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
				className="md:hidden fixed top-4 left-4 z-50 p-2 hover:bg-muted rounded-lg"
			>
				<span className="text-2xl">☰</span>
			</button>

			{/* Sidebar */}
			<aside
				className={`fixed md:static flex flex-col justify-between w-64 h-screen bg-sidebar border-r border-sidebar-border p-6 space-y-8 transform transition-transform md:transform-none ${
					mobileMenuOpen
						? "translate-x-0"
						: "-translate-x-full md:translate-x-0"
				} z-40`}
			>
				<div className="space-y-8">
					<h1 className="text-2xl flex items-center gap-2 font-bold text-sidebar-primary">
						<img
							src="/icon.jpg"
							alt=""
							className="w-10 rounded-xl"
						/>
						<span className="text-2xl font-bold text-gray-900">
							CarePath
						</span>
					</h1>

					<nav className="space-y-2">
						{doctorRoutes.map((route) => (
							<NavLink
								key={route}
								to={`/doctor/${route}`}
								onClick={(e) => {
									if (route === "patient-profile")
										e.preventDefault();
									setMobileMenuOpen(false);
								}}
								className={({ isActive }) =>
									`w-full text-left px-4 py-2 rounded-lg transition-colors ${
										route === "patient-profile"
											? "cursor-not-allowed"
											: " "
									} relative block ${
										isActive
											? "bg-sidebar-primary text-sidebar-primary-foreground"
											: "text-sidebar-foreground hover:bg-sidebar-accent/20"
									}`
								}
							>
								<span className="flex items-center justify-between">
									{formatLabel(route)}
								</span>
							</NavLink>
						))}
					</nav>
				</div>

				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button variant="outline" className="w-full">
							<LogOut className="mr-2 h-4 w-4" />
							Logout
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								Are you sure you want to logout?
							</AlertDialogTitle>
							<AlertDialogDescription>
								You will be redirected to the login page.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleLogout}
								className="bg-red-600 hover:bg-red-500"
							>
								Logout
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</aside>

			{/* Mobile Overlay */}
			{mobileMenuOpen && (
				<div
					className="fixed inset-0 bg-black/50 md:hidden z-30"
					onClick={() => setMobileMenuOpen(false)}
				/>
			)}
		</>
	);
}

export default DoctorSidebar;

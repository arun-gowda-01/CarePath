import { NavLink, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
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
import { LogOut } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface AdminSidebarProps {
	mobileMenuOpen: boolean;
	setMobileMenuOpen: (open: boolean) => void;
}

function AdminSidebar({
	mobileMenuOpen,
	setMobileMenuOpen,
}: AdminSidebarProps) {
	const navigate = useNavigate();
	const { setUser } = useAuth();
	const adminRoutes = [
		{ path: "user-management", label: "User Management" },
		{ path: "configuration", label: "Platform Configuration" },
	];

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
			<Button
				onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
				variant="ghost"
				size="icon"
				className="md:hidden fixed top-4 left-4 z-50"
			>
				<span className="text-2xl">☰</span>
			</Button>

			{/* Sidebar */}
			<aside
				className={`fixed md:static w-64 h-screen bg-sidebar border-r border-sidebar-border p-6 space-y-8 transform transition-transform md:transform-none ${
					mobileMenuOpen
						? "translate-x-0"
						: "-translate-x-full md:translate-x-0"
				} z-40 flex flex-col`}
			>
				<nav className="space-y-2 flex-1">
					{adminRoutes.map((route) => (
						<NavLink
							key={route.path}
							to={`/admin/${route.path}`}
							onClick={() => setMobileMenuOpen(false)}
							className={({ isActive }) =>
								`w-full text-left px-4 py-2 rounded-lg transition-colors block ${
									isActive
										? "bg-sidebar-primary text-sidebar-primary-foreground"
										: "text-sidebar-foreground hover:bg-sidebar-accent/20"
								}`
							}
						>
							{route.label}
						</NavLink>
					))}
				</nav>

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

export default AdminSidebar;

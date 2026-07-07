import { NavLink, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { messageApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
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

function PatientHeader() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const { setUser } = useAuth();
	const [unreadCount, setUnreadCount] = useState(0);

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

	useEffect(() => {
		if (!user) return;
		let isMounted = true;

		const fetchUnread = async () => {
			try {
				const response = await messageApi.getAllConversations();
				const conversations = (response.data.data || []) as Array<{
					unreadCount?: number;
				}>;
				if (!isMounted) return;
				const total = conversations.reduce(
					(sum, conv) => sum + (conv.unreadCount || 0),
					0
				);
				setUnreadCount(total);
			} catch {
				if (isMounted) setUnreadCount(0);
			}
		};

		fetchUnread();

		const socket = getSocket();

		const handleNewMessage = (msg: any) => {
			try {
				const receiver = msg?.receiverId;
				const receiverId =
					receiver && typeof receiver === "object"
						? receiver._id
						: receiver;
				if (receiverId === user.id) {
					setUnreadCount((count) => count + 1);
				}
			} catch {
				// ignore
			}
		};

		const handleMessageRead = () => {
			// When messages are marked as read, refresh from server
			fetchUnread();
		};

		socket.on("message:new", handleNewMessage);
		socket.on("message:read", handleMessageRead);

		return () => {
			isMounted = false;
			socket.off("message:new", handleNewMessage);
			socket.off("message:read", handleMessageRead);
		};
	}, [user]);

	const headerRoutes = [
		"home",
		"tasks",
		"checkin",
		"messages",
		"reports",
		"profile",
		"logout",
	];

	return (
		<nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 flex justify-around md:static md:border-b md:border-t-0 md:px-6 md:py-4 overflow-x-auto">
			{headerRoutes.map((route) => {
				const label = route.charAt(0).toUpperCase() + route.slice(1);

				if (route === "logout") {
					return (
						<AlertDialog key={route}>
							<AlertDialogTrigger asChild>
								<button className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg font-medium transition-colors text-muted-foreground hover:text-foreground">
									<span className="flex items-center gap-1">
										<LogOut className="h-4 w-4" />
										{label}
									</span>
								</button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										Are you sure you want to logout?
									</AlertDialogTitle>
									<AlertDialogDescription>
										You will be redirected to the login
										page.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>
										Cancel
									</AlertDialogCancel>
									<AlertDialogAction
										onClick={handleLogout}
										className="bg-red-600 hover:bg-red-500"
									>
										Logout
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					);
				}

				return (
					<NavLink
						key={route}
						to={route}
						className={({ isActive }) =>
							`flex flex-col items-center gap-1 px-3 py-2 rounded-lg font-medium transition-colors ${
								isActive
									? "text-primary bg-primary/10"
									: "text-muted-foreground hover:text-foreground"
							}`
						}
					>
						<span className="flex items-center gap-1">
							{label}
							{route === "messages" && unreadCount > 0 && (
								<span className="ml-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs px-1.5 min-w-[1.25rem]">
									{unreadCount > 9 ? "9+" : unreadCount}
								</span>
							)}
						</span>
					</NavLink>
				);
			})}
		</nav>
	);
}

export default PatientHeader;

import { NavLink, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { messageApi, videoCallApi } from "@/lib/api";
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
import {
	LogOut,
	Video,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface IncomingCall {
	roomId: string;
	fromUserId?: string;
	fromName?: string;
}

function PatientHeader() {
	const { user, setUser } = useAuth();
	const navigate = useNavigate();

	const [unreadCount, setUnreadCount] = useState(0);

	const [incomingCall, setIncomingCall] =
		useState<IncomingCall | null>(null);

	// ------------------------------------------------------------
	// Logout
	// ------------------------------------------------------------

	const handleLogout = async () => {
		try {
			await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/auth/logout`,
				{},
				{
					withCredentials: true,
				}
			);

			setUser(null);

			toast.success(
				"Logged out successfully"
			);

			navigate("/login");
		} catch (error) {
			console.error(
				"Logout failed:",
				error
			);

			toast.error(
				"Logout failed"
			);
		}
	};

	// ------------------------------------------------------------
	// Accept incoming video call
	// ------------------------------------------------------------

	const handleAcceptVideoCall = () => {
		if (!incomingCall?.roomId) {
			return;
		}

		const roomId =
			incomingCall.roomId;

		// Remove popup first
		setIncomingCall(null);

		// Open the existing LiveKit video-call page
		window.open(
			`/video-call/${roomId}`,
			"_blank",
			"noopener,noreferrer"
		);
	};

	// ------------------------------------------------------------
	// Decline incoming video call
	// ------------------------------------------------------------

	const handleDeclineVideoCall = async () => {
		if (!incomingCall?.roomId) {
			return;
		}

		const roomId =
			incomingCall.roomId;

		// Remove popup immediately
		setIncomingCall(null);

		try {
			await videoCallApi.endCall(
				roomId
			);

			toast.info(
				"Video call declined"
			);
		} catch (error) {
			console.error(
				"Failed to decline video call:",
				error
			);

			toast.error(
				"Unable to decline the video call"
			);
		}
	};

	// ------------------------------------------------------------
	// Socket listeners
	// ------------------------------------------------------------

	useEffect(() => {
		if (!user) {
			return;
		}

		let isMounted = true;

		const fetchUnread = async () => {
			try {
				const response =
					await messageApi.getAllConversations();

				const conversations =
					(response.data.data ||
						[]) as Array<{
						unreadCount?: number;
					}>;

				if (!isMounted) {
					return;
				}

				const total =
					conversations.reduce(
						(sum, conversation) =>
							sum +
							(conversation.unreadCount ||
								0),
						0
					);

				setUnreadCount(
					total
				);
			} catch (error) {
				console.error(
					"Failed to fetch unread messages:",
					error
				);

				if (isMounted) {
					setUnreadCount(0);
				}
			}
		};

		// Initial unread message count
		fetchUnread();

		const socket = getSocket();

		// --------------------------------------------------------
		// New message
		// --------------------------------------------------------

		const handleNewMessage = (
			msg: any
		) => {
			try {
				const receiver =
					msg?.receiverId;

				const receiverId =
					receiver &&
					typeof receiver ===
						"object"
						? receiver._id
						: receiver;

				if (
					receiverId ===
					user.id
				) {
					setUnreadCount(
						(count) =>
							count + 1
					);
				}
			} catch (error) {
				console.error(
					"Error handling new message:",
					error
				);
			}
		};

		// --------------------------------------------------------
		// Message read
		// --------------------------------------------------------

		const handleMessageRead =
			() => {
				fetchUnread();
			};

		// --------------------------------------------------------
		// Incoming video call
		// --------------------------------------------------------

		const handleIncomingCall =
			(payload: {
				roomId?: string;
				fromUserId?: string;
				fromName?: string;
			}) => {
				console.log(
					"Incoming video call:",
					payload
				);

				if (
					!payload?.roomId
				) {
					console.error(
						"Incoming video call has no roomId"
					);
					return;
				}

				setIncomingCall({
					roomId:
						payload.roomId,

					fromUserId:
						payload.fromUserId,

					fromName:
						payload.fromName ||
						"Your doctor",
				});

				toast.info(
					`Incoming video call from ${
						payload.fromName ||
						"your doctor"
					}`
				);
			};

		// --------------------------------------------------------
		// Video call ended
		// --------------------------------------------------------

		const handleVideoEnded =
			(payload: {
				roomId?: string;
			}) => {
				console.log(
					"Video call ended:",
					payload
				);

				if (
					!payload?.roomId
				) {
					return;
				}

				setIncomingCall(
					(currentCall) => {
						if (
							currentCall?.roomId ===
							payload.roomId
						) {
							toast.info(
								"Video call ended"
							);

							return null;
						}

						return currentCall;
					}
				);
			};

		// --------------------------------------------------------
		// Register socket listeners
		// --------------------------------------------------------

		socket.on(
			"message:new",
			handleNewMessage
		);

		socket.on(
			"message:read",
			handleMessageRead
		);

		socket.on(
			"video:incoming",
			handleIncomingCall
		);

		socket.on(
			"video:ended",
			handleVideoEnded
		);

		// --------------------------------------------------------
		// Cleanup
		// --------------------------------------------------------

		return () => {
			isMounted = false;

			socket.off(
				"message:new",
				handleNewMessage
			);

			socket.off(
				"message:read",
				handleMessageRead
			);

			socket.off(
				"video:incoming",
				handleIncomingCall
			);

			socket.off(
				"video:ended",
				handleVideoEnded
			);
		};
	}, [user]);

	// ------------------------------------------------------------
	// Navigation routes
	// ------------------------------------------------------------

	const headerRoutes = [
		"home",
		"tasks",
		"checkin",
		"messages",
		"reports",
		"profile",
		"logout",
	];

	// ------------------------------------------------------------
	// UI
	// ------------------------------------------------------------

	return (
		<>
			{/* =====================================================
			    INCOMING VIDEO CALL POPUP
			    ===================================================== */}

			{incomingCall && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
					<div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
						{/* Video icon */}

						<div className="mb-4 flex justify-center">
							<div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
								<Video className="h-8 w-8 text-primary" />
							</div>
						</div>

						{/* Title */}

						<div className="text-center">
							<h2 className="text-xl font-bold text-foreground">
								Incoming Video Call
							</h2>

							<p className="mt-2 text-base text-muted-foreground">
								<span className="font-semibold text-foreground">
									{incomingCall.fromName ||
										"Your doctor"}
								</span>{" "}
								is calling you
							</p>
						</div>

						{/* Buttons */}

						<div className="mt-6 flex gap-3">
							<Button
								type="button"
								onClick={
									handleAcceptVideoCall
								}
								className="flex-1 bg-green-600 text-white hover:bg-green-700"
							>
								<Video className="mr-2 h-4 w-4" />
								Accept
							</Button>

							<Button
								type="button"
								variant="outline"
								onClick={
									handleDeclineVideoCall
								}
								className="flex-1"
							>
								Decline
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* =====================================================
			    PATIENT NAVIGATION
			    ===================================================== */}

			<nav className="fixed bottom-0 left-0 right-0 flex justify-around overflow-x-auto border-t border-border bg-card px-4 py-3 md:static md:border-b md:border-t-0 md:px-6 md:py-4">
				{headerRoutes.map(
					(route) => {
						const label =
							route
								.charAt(
									0
								)
								.toUpperCase() +
							route.slice(
								1
							);

						// ------------------------------------------------
						// Logout
						// ------------------------------------------------

						if (
							route ===
							"logout"
						) {
							return (
								<AlertDialog
									key={
										route
									}
								>
									<AlertDialogTrigger
										asChild
									>
										<button className="flex flex-col items-center gap-1 rounded-lg px-3 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground">
											<span className="flex items-center gap-1">
												<LogOut className="h-4 w-4" />
												{
													label
												}
											</span>
										</button>
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
											<AlertDialogCancel>
												Cancel
											</AlertDialogCancel>

											<AlertDialogAction
												onClick={
													handleLogout
												}
												className="bg-red-600 hover:bg-red-500"
											>
												Logout
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							);
						}

						// ------------------------------------------------
						// Normal navigation item
						// ------------------------------------------------

						return (
							<NavLink
								key={
									route
								}
								to={
									route
								}
								className={({
									isActive,
								}) =>
									`flex flex-col items-center gap-1 rounded-lg px-3 py-2 font-medium transition-colors ${
										isActive
											? "bg-primary/10 text-primary"
											: "text-muted-foreground hover:text-foreground"
									}`
								}
							>
								<span className="flex items-center gap-1">
									{label}

									{route ===
										"messages" &&
										unreadCount >
											0 && (
											<span className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs text-white">
												{unreadCount >
												9
													? "9+"
													: unreadCount}
											</span>
										)}
								</span>
							</NavLink>
						);
					}
				)}
			</nav>
		</>
	);
}

export default PatientHeader;
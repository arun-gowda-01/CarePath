import {
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	useNavigate,
	useParams,
} from "react-router";
import {
	LiveKitRoom,
	VideoConference,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { videoCallApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface JoinRoomResponse {
	roomId: string;
	participants: string[];
	status: string;
	token: string;
	serverUrl: string;
}

function VideoCall() {
	const { roomId } =
		useParams<{ roomId: string }>();

	const navigate = useNavigate();

	const {
		user,
		loading: authLoading,
	} = useAuth();

	const [token, setToken] =
		useState<string | null>(null);

	const [serverUrl, setServerUrl] =
		useState<string | null>(null);

	const [callLoading, setCallLoading] =
		useState(true);

	const [endingCall, setEndingCall] =
		useState(false);

	const endedRef = useRef(false);

	// ------------------------------------------------------------
	// End call
	// ------------------------------------------------------------

	const handleEndCall = useCallback(
		async (
			showToast = true
		) => {
			if (
				endedRef.current ||
				!roomId
			) {
				return;
			}

			endedRef.current = true;
			setEndingCall(true);

			try {
				await videoCallApi.endCall(
					roomId
				);

				if (showToast) {
					toast.success(
						"Video call ended"
					);
				}
			} catch (error) {
				console.error(
					"Failed to end video call:",
					error
				);

				if (showToast) {
					toast.error(
						"Failed to end video call"
					);
				}
			} finally {
				if (showToast) {
					navigate(
						-1
					);
				}
			}
		},
		[roomId, navigate]
	);

	// ------------------------------------------------------------
	// Join room
	// ------------------------------------------------------------

	useEffect(() => {
		if (authLoading) {
			return;
		}

		if (!user) {
			navigate("/login");
			return;
		}

		if (!roomId) {
			toast.error(
				"Missing room information"
			);

			navigate(-1);
			return;
		}

		let isMounted = true;

		const joinRoom = async () => {
			try {
				const response =
					await videoCallApi.joinRoom(
						roomId
					);

				const payload =
					response.data.data as
						| JoinRoomResponse
						| undefined;

				if (
					!payload?.token ||
					!payload?.serverUrl
				) {
					throw new Error(
						"Invalid video call configuration"
					);
				}

				if (!isMounted) {
					return;
				}

				setToken(
					payload.token
				);

				setServerUrl(
					payload.serverUrl
				);
			} catch (error) {
				console.error(
					"Failed to join video call:",
					error
				);

				if (!isMounted) {
					return;
				}

				toast.error(
					"Failed to join video call"
				);

				navigate(-1);
			} finally {
				if (isMounted) {
					setCallLoading(
						false
					);
				}
			}
		};

		joinRoom();

		return () => {
			isMounted = false;
		};
	}, [
		roomId,
		user,
		authLoading,
		navigate,
	]);

	// ------------------------------------------------------------
	// Cleanup when browser/tab is closed
	// ------------------------------------------------------------

	useEffect(() => {
		if (!roomId) {
			return;
		}

		const handlePageExit = () => {
			if (endedRef.current) {
				return;
			}

			endedRef.current = true;

			/*
			 * keepalive allows the browser to continue the
			 * request while the page is being unloaded.
			 */
			fetch(
				`${import.meta.env.VITE_BACKEND_URL}/video-call/end/${roomId}`,
				{
					method: "POST",
					credentials: "include",
					keepalive: true,
					headers: {
						"Content-Type":
							"application/json",
					},
					body: "{}",
				}
			).catch(() => {
				// Browser may cancel the request during unload.
			});
		};

		window.addEventListener(
			"pagehide",
			handlePageExit
		);

		return () => {
			window.removeEventListener(
				"pagehide",
				handlePageExit
			);
		};
	}, [roomId]);

	// ------------------------------------------------------------
	// Loading
	// ------------------------------------------------------------

	if (
		authLoading ||
		callLoading
	) {
		return (
			<div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
				<p className="text-sm">
					Connecting to video call...
				</p>
			</div>
		);
	}

	// ------------------------------------------------------------
	// Invalid configuration
	// ------------------------------------------------------------

	if (
		!token ||
		!serverUrl
	) {
		return (
			<div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-foreground">
				<p className="mb-4 text-sm">
					Unable to start video call.
				</p>

				<button
					type="button"
					onClick={() =>
						navigate(-1)
					}
					className="rounded-md border px-4 py-2 text-sm"
				>
					Go back
				</button>
			</div>
		);
	}

	// ------------------------------------------------------------
	// LiveKit
	// ------------------------------------------------------------

	return (
		<div className="relative h-screen w-screen bg-black">
			<LiveKitRoom
				token={token}
				serverUrl={serverUrl}
				data-lk-theme="default"
				style={{
					height: "100vh",
					width: "100vw",
				}}
			>
				<VideoConference />
			</LiveKitRoom>

			{/* ------------------------------------------------------
			    End Call button
			    ------------------------------------------------------ */}

			<div className="pointer-events-none absolute bottom-6 left-0 right-0 z-50 flex justify-center">
				<button
					type="button"
					disabled={endingCall}
					onClick={() =>
						handleEndCall(
							true
						)
					}
					className="pointer-events-auto rounded-full bg-red-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{endingCall
						? "Ending..."
						: "End Call"}
				</button>
			</div>
		</div>
	);
}

export default VideoCall;
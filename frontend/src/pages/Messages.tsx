import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { messageApi, patientApi, videoCallApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { Message as ApiMessage } from "@/lib/types";
import { toast } from "sonner";

function Messages() {
	const { user } = useAuth();
	const [messageInput, setMessageInput] = useState("");
	const [callState, setCallState] = useState<
		"idle" | "ringing" | "connected" | "ended"
	>("idle");
	const [isMuted, setIsMuted] = useState(false);
	const [isVideoOn, setIsVideoOn] = useState(true);
	const [callDuration, setCallDuration] = useState(0);
	const [conversations, setConversations] = useState<any[]>([]);
	const [selectedConversation, setSelectedConversation] = useState<any | null>(
		null
	);
	const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
	const [incomingCall, setIncomingCall] = useState<
		{ roomId: string; fromName?: string } | null
	>(null);

	const generateConversationId = () => {
		return `${user?.id || "u"}-${Date.now()}-${Math.random()
			.toString(36)
			.slice(2, 8)}`;
	};

	const loadMessagesForConversation = async (conversationId: string) => {
		if (!user) return;
		try {
			const response = await messageApi.getConversationById(conversationId);
			const payload = response.data.data as {
				messages?: ApiMessage[];
			};
			const apiMessages = (payload?.messages || []) as ApiMessage[];
			const last = apiMessages[apiMessages.length - 1] as
				| ApiMessage
				| undefined;

			setConversations((prev) => {
				const updated = prev.map((conv) => {
					if (String(conv.conversationId) === String(conversationId)) {
						return {
							...conv,
							messages: apiMessages.map((m) => {
								const rawSender = (m as unknown as any).senderId;
								const senderId =
									rawSender && typeof rawSender === "object"
										? rawSender._id
										: rawSender;
								const isUserMessage = senderId === user.id;
								return {
									sender: isUserMessage ? "You" : conv.name,
									text: m.text,
									time: new Date(m.createdAt).toLocaleTimeString(
										[],
										{
											hour: "2-digit",
											minute: "2-digit",
										}
									),
									isUser: isUserMessage,
									status: m.status,
								};
							}),
							lastMessage: last?.text || "",
							time: last?.createdAt
								? new Date(last.createdAt).toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								})
								: "",
							unread: false,
						};
					}
					return conv;
				});
				const newlySelected =
					updated.find(
						(c) => String(c.conversationId) === String(conversationId)
					) || updated[0];
				if (newlySelected) {
					setSelectedConversation(newlySelected);
				}
				return updated;
			});
		} catch (err) {
			toast.error("Failed to load messages");
		}
	};

	useEffect(() => {
		let interval: ReturnType<typeof setInterval> | undefined;
		if (callState === "connected") {
			interval = setInterval(() => {
				setCallDuration((prev) => prev + 1);
			}, 1000);
		}
		return () => clearInterval(interval);
	}, [callState]);

	useEffect(() => {
		if (!user) return;
		let isMounted = true;
		const initializeConversation = async () => {
			try {
				const analyticsRes = await patientApi.getAnalytics();
				const analyticsData = analyticsRes.data.data as {
					assignedDoctor?: any;
				};
				const assignedDoctor = analyticsData?.assignedDoctor;
				const doctorUser = assignedDoctor?.userId;

				if (!doctorUser?._id) {
					if (isMounted) {
						setConversations([]);
						setSelectedConversation(null);
					}
					toast.error("No doctor assigned yet");
					return;
				}

				if (!isMounted) return;

				// Load existing conversations with this doctor
				const convRes = await messageApi.getAllConversations();
				const data = (convRes.data.data || []) as Array<{
					conversationId: string;
					otherUser: {
						_id: string;
						firstName: string;
						lastName: string;
						role: string;
					};
					lastMessage?: ApiMessage;
					unreadCount?: number;
				}>;

				const doctorConvs = data.filter(
					(c) => c.otherUser._id === doctorUser._id
				);

				const existingConversations = doctorConvs.map((conv) => {
					const last = conv.lastMessage as ApiMessage | undefined;
					return {
						id: doctorUser._id,
						conversationId: conv.conversationId,
						name: `${doctorUser.firstName} ${doctorUser.lastName}`,
						role: conv.otherUser.role || assignedDoctor.role || "Doctor",
						lastMessage: last?.text || "",
						time: last?.createdAt
							? new Date(last.createdAt).toLocaleTimeString([], {
								hour: "2-digit",
								minute: "2-digit",
							})
							: "",
						unread: (conv.unreadCount || 0) > 0,
						messages: [],
						callHistory: [],
					};
				});

				// Always start with a fresh new chat on load
				const newChatConv = {
					id: doctorUser._id,
					conversationId: generateConversationId(),
					name: `${doctorUser.firstName} ${doctorUser.lastName}`,
					role: assignedDoctor.role || "Doctor",
					lastMessage: "",
					time: "",
					unread: false,
					messages: [],
					callHistory: [],
					isNew: true,
				};

				setConversations([newChatConv, ...existingConversations]);
				setSelectedConversation(newChatConv);
			} catch (err) {
				if (isMounted) {
					toast.error("Failed to load conversations");
				}
			}
		};

		initializeConversation();
		return () => {
			isMounted = false;
		};
	}, [user]);

	useEffect(() => {
		if (!user) return;
		const socket = getSocket();

		const handleNewMessage = (msg: any) => {
			try {
				const rawSender = msg?.senderId;
				const rawReceiver = msg?.receiverId;
				const senderId =
					rawSender && typeof rawSender === "object"
						? rawSender._id
						: rawSender;
				const receiverId =
					rawReceiver && typeof rawReceiver === "object"
						? rawReceiver._id
						: rawReceiver;

				if (!senderId || !receiverId) return;

				const otherUserId =
					senderId === user.id ? receiverId : senderId === receiverId
						? null
						: senderId;

				if (!otherUserId) return;
				const msgConversationId = msg?.conversationId;
				if (
					selectedConversation &&
					msgConversationId &&
					String(selectedConversation.conversationId) ===
					String(msgConversationId)
				) {
					loadMessagesForConversation(String(msgConversationId));
				}
			} catch {
				// ignore
			}
		};

		const handleMessageRead = () => {
			if (selectedConversation?.conversationId) {
				loadMessagesForConversation(
					String(selectedConversation.conversationId)
				);
			}
		};

		const handleIncomingCall = (payload: {
			roomId?: string;
			fromUserId?: string;
			fromName?: string;
		}) => {
			if (!payload?.roomId) return;
			setIncomingCall({
				roomId: payload.roomId,
				fromName: payload.fromName,
			});
			setCallState("ringing");
			setCallDuration(0);
			toast.info(
				`Incoming video call from ${payload.fromName || "your doctor"
				}`
			);
		};

		const handleVideoEnded = (payload: { roomId?: string }) => {
			if (!payload?.roomId) return;
			if (currentRoomId && payload.roomId === currentRoomId) {
				setCallState("idle");
				setCallDuration(0);
				setCurrentRoomId(null);
			}
			setIncomingCall(null);
		};

		socket.on("message:new", handleNewMessage);
		socket.on("message:read", handleMessageRead);
		socket.on("video:incoming", handleIncomingCall);
		socket.on("video:ended", handleVideoEnded);

		return () => {
			socket.off("message:new", handleNewMessage);
			socket.off("message:read", handleMessageRead);
			socket.off("video:incoming", handleIncomingCall);
			socket.off("video:ended", handleVideoEnded);
		};
	}, [user, selectedConversation, currentRoomId]);

	const handleSendMessage = async () => {
		if (!messageInput.trim() || !selectedConversation) return;
		if (!user) {
			toast.error("You must be logged in to send messages");
			return;
		}

		const text = messageInput;
		setMessageInput("");
		try {
			await messageApi.sendMessage({
				receiverId: String(selectedConversation.id),
				text,
				conversationId: String(selectedConversation.conversationId),
			});
			await loadMessagesForConversation(
				String(selectedConversation.conversationId)
			);
		} catch (err) {
			toast.error("Failed to send message");
			setMessageInput(text);
		}
	};

	const handleAcceptCall = async () => {
		if (!incomingCall) return;
		try {
			const { roomId } = incomingCall;
			setCurrentRoomId(roomId);
			// Open the in-app LiveKit-powered video call page
			window.open(`/video-call/${roomId}`, "_blank", "noopener,noreferrer");
			setCallState("connected");
			setIncomingCall(null);
		} catch (error) {
			toast.error("Failed to join video call");
			setCallState("idle");
			setCallDuration(0);
			setCurrentRoomId(null);
			setIncomingCall(null);
		}
	};

	const handleDeclineCall = async () => {
		if (!incomingCall) return;
		const { roomId } = incomingCall;
		setIncomingCall(null);
		try {
			await videoCallApi.endCall(roomId);
		} catch {
			// ignore API errors when declining
		}
		setCallState("idle");
		setCallDuration(0);
	};

	const handleEndCall = async () => {
		const updatedConversations = conversations.map((conv) => {
			if (conv.id === selectedConversation.id) {
				return {
					...conv,
					callHistory: [
						{
							type: "video",
							duration: `${Math.floor(
								callDuration / 60
							)}:${String(callDuration % 60).padStart(2, "0")}`,
							date: new Date().toLocaleString(),
							status: "completed",
						},
						...conv.callHistory,
					],
				};
			}
			return conv;
		});
		setConversations(updatedConversations);
		setSelectedConversation(
			updatedConversations.find((c) => c.id === selectedConversation.id)!
		);
		if (currentRoomId) {
			try {
				await videoCallApi.endCall(currentRoomId);
			} catch {
				// ignore API errors when ending
			}
		}
		setCallState("idle");
		setCallDuration(0);
		setCurrentRoomId(null);
	};

	const handleNewChat = () => {
		if (!conversations.length) return;
		const base = selectedConversation || conversations[0];
		const newConv = {
			id: base.id,
			conversationId: generateConversationId(),
			name: base.name,
			role: base.role,
			lastMessage: "",
			time: "",
			unread: false,
			messages: [],
			callHistory: [],
			isNew: true,
		};
		setConversations((prev: any[]) => [newConv, ...prev]);
		setSelectedConversation(newConv);
		setMessageInput("");
		setCallState("idle");
		setCallDuration(0);
	};

	const formatCallDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${String(secs).padStart(2, "0")}`;
	};

	return (
		<div className="w-full mx-auto p-4 md:p-6 h-[calc(100vh-5rem)] flex flex-col md:flex-row gap-4">
			{/* Conversations List */}
			<div className="hidden md:flex md:w-80 flex-col border-r border-border">
				<h1 className="text-2xl font-bold text-foreground mb-4">
					Messages
				</h1>
				<div className="space-y-2 overflow-y-auto flex-1">
					{conversations.map((conv) => (
						<div
							key={conv.conversationId}
							onClick={() => {
								setSelectedConversation(conv);
								setCallState("idle");
								if (conv.conversationId && !conv.isNew) {
									loadMessagesForConversation(
										String(conv.conversationId)
									);
								}
							}}
							className={`p-3 rounded-lg cursor-pointer transition-colors ${String(selectedConversation?.conversationId) ===
									String(conv.conversationId)
									? "bg-primary/10 border border-primary"
									: "hover:bg-muted border border-transparent"
								}`}

						>
							<div className="flex items-start justify-between gap-2">
								<div className="flex-1 min-w-0">
									<p
										className={`font-medium text-foreground ${conv.unread ? "font-bold" : ""
											}`}
									>
										{conv.name}
									</p>
									<p className="text-xs text-muted-foreground">
										{conv.role}
									</p>
									<p
										className={`text-sm truncate mt-1 ${conv.unread
												? "text-foreground font-medium"
												: "text-muted-foreground"
											}`}
									>
										{conv.lastMessage}
									</p>
								</div>
								{conv.unread && (
									<div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />
								)}
							</div>
							<p className="text-xs text-muted-foreground mt-2">
								{conv.time}
							</p>
						</div>
					))}
				</div>
			</div>

			{/* Chat Area */}
			<div className="flex-1 overflow-auto flex flex-col">
				{/* Header with Video Call Button */}
				<div className="pb-4 border-b border-border mb-4 flex items-center justify-between">
					<div>
						<h2 className="text-2xl font-bold text-foreground">
							{selectedConversation ? selectedConversation.name : "Messages"}
						</h2>
						<p className="text-sm text-muted-foreground">
							{selectedConversation?.role || ""}
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							onClick={handleNewChat}
							disabled={!selectedConversation}
						>
							New Chat
						</Button>
					</div>
				</div>

				{/* In-Call Interface */}
				{callState !== "idle" && (
					<Card className="p-4 mb-4 bg-linear-to-r from-blue-50 to-purple-50 border-blue-200">
						<div className="flex flex-col gap-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-semibold text-foreground">
										{callState === "ringing"
											? "Incoming video call"
											: "Connected"}
									</p>
									<p className="text-sm text-muted-foreground">
										{callState === "ringing"
											? incomingCall?.fromName ||
											selectedConversation?.name ||
											"Your doctor is calling you"
											: formatCallDuration(callDuration)}
									</p>
								</div>
								{callState === "ringing" && (
									<div className="flex items-center gap-2">
										<Button
											onClick={handleAcceptCall}
											className="bg-green-600 hover:bg-green-700 text-white"
										>
											Accept
										</Button>
										<Button
											onClick={handleDeclineCall}
											variant="outline"
										>
											Decline
										</Button>
									</div>
								)}
							</div>

							{/* Video Preview Area */}
							<div className="bg-black rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
								{isVideoOn ? (
									<div className="w-full h-full bg-linear-to-br from-gray-800 to-black flex items-center justify-center">
										<div className="text-center">
											<div className="text-6xl mb-2">
												📹
											</div>
											<p className="text-white text-sm">
												Your video
											</p>
										</div>
									</div>
								) : (
									<div className="flex flex-col items-center justify-center gap-2">
										<div className="text-4xl">🎥</div>
										<p className="text-white text-sm">
											Video off
										</p>
									</div>
								)}

								{/* Remote Video Indicator */}
								<div className="absolute top-4 right-4 w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center border-2 border-white">
									<div className="text-center">
										<div className="text-3xl">👨‍⚕️</div>
										<p className="text-white text-xs mt-1">
											{selectedConversation.name}
										</p>
									</div>
								</div>
							</div>

							{/* Call Controls */}
							<div className="flex items-center justify-center gap-4">
								<Button
									onClick={() => setIsMuted(!isMuted)}
									variant={
										isMuted ? "destructive" : "outline"
									}
									className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
									title={isMuted ? "Unmute" : "Mute"}
								>
									{isMuted ? "🔇" : "🎤"}
								</Button>
								<Button
									onClick={() => setIsVideoOn(!isVideoOn)}
									variant={
										!isVideoOn ? "destructive" : "outline"
									}
									className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
									title={
										isVideoOn
											? "Turn off video"
											: "Turn on video"
									}
								>
									{isVideoOn ? "📹" : "🎥"}
								</Button>
								<Button
									onClick={handleEndCall}
									className="bg-red-600 hover:bg-red-700 text-white rounded-full w-12 h-12 p-0 flex items-center justify-center"
									title="End call"
								>
									☎️
								</Button>
							</div>
						</div>
					</Card>
				)}

				{/* Emergency Banner */}
				<Card className="p-4 bg-yellow-50 border-yellow-200 text-sm text-yellow-800 mb-4">
					<p>
						This channel is for routine questions. For emergencies,
						call 108.
					</p>
				</Card>

				{/* Messages */}
				<div className="flex-1 space-y-3 overflow-y-auto mb-4">
					{selectedConversation &&
						selectedConversation.messages &&
						selectedConversation.messages.length > 0 ? (
						selectedConversation.messages.map((msg: any, idx: number) => (
							<div
								key={idx}
								className={`flex ${msg.isUser ? "justify-end" : "justify-start"
									}`}
							>
								<div
									className={`max-w-xs p-3 rounded-lg ${msg.isUser
											? "bg-primary text-primary-foreground"
											: "bg-muted text-foreground"
										}`}
								>
									<p className="text-sm">{msg.text}</p>
									<div className="flex items-center gap-1 mt-1">
										<p className="text-xs opacity-70">
											{msg.time}
										</p>
										{msg.isUser && (
											<span className="text-xs opacity-70">
												{msg.status === "sent"
													? "✓"
													: msg.status === "read"
														? "✓✓"
														: "..."}
											</span>
										)}
									</div>
								</div>
							</div>
						))
					) : (
						<div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
							No messages yet.
						</div>
					)}

					{selectedConversation &&
						selectedConversation.callHistory &&
						selectedConversation.callHistory.length > 0 && (
							<div className="mt-6 pt-4 border-t border-border">
								<p className="text-xs font-semibold text-muted-foreground mb-3">
									CALL HISTORY
								</p>
								<div className="space-y-2">
									{selectedConversation.callHistory.map(
										(call: any, idx: number) => (
											<div
												key={idx}
												className="flex items-center gap-3 p-2 rounded bg-muted/50"
											>
												<span className="text-lg">📹</span>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium text-foreground">
														Video consultation
													</p>
													<p className="text-xs text-muted-foreground">
														{call.date}
													</p>
												</div>
												<p className="text-sm font-medium text-foreground">
													{call.duration}
												</p>
											</div>
										)
									)}
								</div>
							</div>
						)}
				</div>

				{/* Input Area */}
				<div className="flex gap-2 pt-4 border-t border-border">
					<input
						type="text"
						placeholder="Type a message..."
						value={messageInput}
						onChange={(e) => setMessageInput(e.target.value)}
						onKeyPress={(e) =>
							e.key === "Enter" && handleSendMessage()
						}
						className="flex-1 px-3 py-2 border border-border rounded-lg bg-input text-foreground"
						disabled={!selectedConversation || callState !== "idle"}
					/>
					<Button
						onClick={handleSendMessage}
						disabled={
							!selectedConversation ||
							!messageInput.trim() ||
							callState !== "idle"
						}
					>
						Send
					</Button>
				</div>
			</div>
		</div>
	);
}

export default Messages;

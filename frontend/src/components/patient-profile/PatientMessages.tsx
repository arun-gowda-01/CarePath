import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { messageApi, videoCallApi } from "@/lib/api";
import type { Patient, Message as ApiMessage } from "@/lib/types";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getSocket } from "@/lib/socket";

interface PatientMessagesProps {
	patient: Patient;
	activeTab: string;
}

interface MessageDisplay {
	sender: string;
	text: string;
	time: string;
	isUser: boolean;
	status?: string;
}

interface CallHistory {
	type: string;
	duration: string;
	date: string;
	status: string;
}

interface Conversation {
	id: string;
	conversationId: string;
	name: string;
	role: string;
	lastMessage: string;
	time: string;
	unread: boolean;
	messages: MessageDisplay[];
	callHistory: CallHistory[];
	isNew?: boolean;
}

function PatientMessages({ patient, activeTab }: PatientMessagesProps) {
	const { user } = useAuth();

	const [messageInput, setMessageInput] = useState("");
	const [callState, setCallState] = useState<
		"idle" | "ringing" | "connected" | "ended"
	>("idle");
	const [isMuted, setIsMuted] = useState(false);
	const [isVideoOn, setIsVideoOn] = useState(true);
	const [callDuration, setCallDuration] = useState(0);
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [selectedConversation, setSelectedConversation] =
		useState<Conversation | null>(null);
	const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
	const [consultations, setConsultations] = useState<CallHistory[]>([]);

	const generateConversationId = () => {
		return `${user?.id || "u"}-${Date.now()}-${Math.random()
			.toString(36)
			.slice(2, 8)}`;
	};

	const loadPatientMessagesForConversation = useCallback(
		async (conversationId: string) => {
			if (!patient || !user) return;
			try {
				const response = await messageApi.getConversationById(
					conversationId
				);
				const apiMessages = ((
					response.data.data as Record<string, unknown>
				)?.messages || []) as ApiMessage[];

				console.log(response);

				setConversations((prev) => {
					const updated = prev.map((conv) => {
						if (
							String(conv.conversationId) ===
							String(conversationId)
						) {
							const mappedMessages = apiMessages.map((m) => {
								const rawSender = (
									m as unknown as Record<string, unknown>
								).senderId;
								const senderId =
									rawSender && typeof rawSender === "object"
										? (rawSender as Record<string, unknown>)
												._id
										: rawSender;
								const isUserMessage = senderId === user.id;
								return {
									sender: isUserMessage
										? "You"
										: `${patient.userId.firstName} ${patient.userId.lastName}`,
									text: m.text,
									time: new Date(
										m.createdAt
									).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									}),
									isUser: isUserMessage,
									status: m.status,
								};
							});

							const last = apiMessages[apiMessages.length - 1] as
								| ApiMessage
								| undefined;

							return {
								...conv,
								messages: mappedMessages,
								lastMessage: last?.text || "",
								time: last?.createdAt
									? new Date(
											last.createdAt
									  ).toLocaleTimeString([], {
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
							(c) =>
								String(c.conversationId) ===
								String(conversationId)
						) || updated[0];
					if (newlySelected) {
						setSelectedConversation(newlySelected);
					}
					return updated;
				});
			} catch {
				toast.error("Failed to load messages");
			}
		},
		[patient, user]
	);

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
		if (!patient || !user) return;
		const fetchConversations = async () => {
			try {
				const response = await messageApi.getAllConversations();
				const data = (response.data.data || []) as Array<{
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

				console.log(response);

				const patientConvs = data.filter(
					(c) => c.otherUser._id === patient.userId._id
				);

				const existingConversations = patientConvs.map((conv) => {
					const last = conv.lastMessage as ApiMessage | undefined;
					return {
						id: patient.userId._id,
						conversationId: conv.conversationId,
						name: `${patient.userId.firstName} ${patient.userId.lastName}`,
						role: "Patient",
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

				// New empty chat at top
				const newChatConv = {
					id: patient.userId._id,
					conversationId: generateConversationId(),
					name: `${patient.userId.firstName} ${patient.userId.lastName}`,
					role: "Patient",
					lastMessage: "",
					time: "",
					unread: false,
					messages: [],
					callHistory: [],
					isNew: true,
				};

				setConversations([newChatConv, ...existingConversations]);
				setSelectedConversation(newChatConv);
			} catch {
				toast.error("Failed to load conversations");
			}
		};

		fetchConversations();
		// generateConversationId is defined inline and uses stable dependencies (user.id, Date.now, Math.random)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [patient, user]);

	useEffect(() => {
		if (!patient || !user) return;

		const fetchConsultations = async () => {
			try {
				const response = await videoCallApi.getConsultationsForPatient(
					patient._id
				);
				const raw = (
					(response.data.data as Record<string, unknown>)
						?.consultations || []
				) as Array<{
					startTime: string;
					endTime?: string;
					duration?: number;
					status: string;
				}>;

				const mapped: CallHistory[] = raw.map((c) => ({
					type: "video",
					date: new Date(c.startTime).toLocaleString(),
					duration: formatCallDuration(c.duration || 0),
					status: c.status,
				}));

				setConsultations(mapped);
			} catch {
				// ignore fetch errors for now
			}
		};

		fetchConsultations();
	}, [patient, user]);

	useEffect(() => {
		if (!user || !patient) return;
		const socket = getSocket();

		const handleNewMessage = (msg: unknown) => {
			try {
				const rawSender = (msg as Record<string, unknown>)?.senderId;
				const rawReceiver = (msg as Record<string, unknown>)
					?.receiverId;
				const senderId =
					rawSender && typeof rawSender === "object"
						? (rawSender as Record<string, unknown>)._id
						: rawSender;
				const receiverId =
					rawReceiver && typeof rawReceiver === "object"
						? (rawReceiver as Record<string, unknown>)._id
						: rawReceiver;

				if (!senderId || !receiverId) return;

				const patientUserId = patient.userId._id;
				const msgConversationId = (msg as Record<string, unknown>)
					?.conversationId;

				if (receiverId === user.id && senderId === patientUserId) {
					if (
						activeTab === "messages" &&
						selectedConversation &&
						msgConversationId &&
						String(selectedConversation.conversationId) ===
							String(msgConversationId)
					) {
						loadPatientMessagesForConversation(
							String(msgConversationId)
						);
					}
				}
			} catch {
				// ignore
			}
		};

		socket.on("message:new", handleNewMessage);

		return () => {
			socket.off("message:new", handleNewMessage);
		};
	}, [
		user,
		patient,
		activeTab,
		selectedConversation,
		loadPatientMessagesForConversation,
	]);

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
			await loadPatientMessagesForConversation(
				String(selectedConversation.conversationId)
			);
		} catch {
			toast.error("Failed to send message");
			setMessageInput(text);
		}
	};

	const handleInitiateCall = async () => {
		if (!user || String(user.role).toLowerCase() !== "doctor") {
			toast.error("Only doctors can start a video call");
			return;
		}
		if (!patient?.userId?._id) {
			toast.error("Patient information is missing");
			return;
		}

		try {
			setCallState("ringing");
			setCallDuration(0);
			const response = await videoCallApi.createRoom({
				participantId: patient.userId._id,
			});
			const payload = response.data.data as { roomId?: string };
			const roomId = payload?.roomId;

			if (!roomId) {
				setCallState("idle");
				toast.error("Failed to create video call room");
				return;
			}

			setCurrentRoomId(roomId);
			// Open the in-app LiveKit-powered video call page
			window.open(`/video-call/${roomId}`, "_blank", "noopener,noreferrer");
			
			setCallState("connected");
		} catch (error) {
			setCallState("idle");
			setCurrentRoomId(null);
			toast.error("Failed to start video call");
		}
	};

	const handleEndCall = async () => {
		if (!selectedConversation) return;

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

		// Update persisted consultations locally so the doctor sees the new entry immediately
		setConsultations((prev) => [
			{
				type: "video",
				duration: `${Math.floor(callDuration / 60)}:${String(
					callDuration % 60
				).padStart(2, "0")}`,
				date: new Date().toLocaleString(),
				status: "completed",
			},
			...prev,
		]);

		if (currentRoomId) {
			try {
				await videoCallApi.endCall(currentRoomId);
			} catch {
				// ignore API errors when ending call
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
		setConversations((prev: Conversation[]) => [newConv, ...prev]);
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
		<Card className="p-4 md:p-6">
			<Tabs defaultValue="chat" className="w-full">
				<TabsList className="mb-4">
					<TabsTrigger value="chat">Message</TabsTrigger>
					<TabsTrigger value="video">Video calling</TabsTrigger>
				</TabsList>
				<TabsContent value="chat">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="md:w-64 flex flex-col border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-4">
							<h2 className="text-lg font-semibold text-foreground mb-2">
								Conversations
							</h2>
							<div className="space-y-2 h-full overflow-y-auto">
								{conversations.map((conv: Conversation) => (
									<button
										key={conv.conversationId}
										type="button"
										onClick={() => {
											setSelectedConversation(conv);
											setCallState("idle");
											if (
												conv.conversationId &&
												!conv.isNew
											) {
												loadPatientMessagesForConversation(
													String(conv.conversationId)
												);
											}
										}}
										className={`w-full text-left p-3 rounded-lg border transition-colors ${
											selectedConversation &&
											selectedConversation.conversationId ===
												conv.conversationId
												? "bg-primary/10 border-primary"
												: "hover:bg-muted border-transparent"
										}`}
									>
										<p className="font-medium text-foreground">
											{conv.name}
										</p>
										<p className="text-xs text-muted-foreground">
											{conv.role}
										</p>
										<p className="text-sm text-muted-foreground truncate mt-1">
											{conv.lastMessage}
										</p>
									</button>
								))}
							</div>
						</div>
						<div className="flex-1 flex flex-col">
							{selectedConversation ? (
								<>
									{/* Header */}
									<div className="mb-3 flex items-center justify-between">
										<div>
											<p className="text-sm font-medium text-foreground">
												{selectedConversation.name}
											</p>
											<p className="text-xs text-muted-foreground">
												{selectedConversation.role}
											</p>
										</div>
										<Button
											variant="outline"
											onClick={handleNewChat}
											disabled={!selectedConversation}
										>
											New Chat
										</Button>
									</div>

									{/* Messages area — fixed min height */}
									<div className="flex-1 min-h-[500px] overflow-y-auto space-y-3 mb-3">
										{(selectedConversation.messages || [])
											.length > 0 ? (
											selectedConversation.messages.map(
												(
													msg: MessageDisplay,
													idx: number
												) => (
													<div
														key={idx}
														className={`flex ${
															msg.isUser
																? "justify-end"
																: "justify-start"
														}`}
													>
														<div
															className={`max-w-xs p-3 rounded-lg ${
																msg.isUser
																	? "bg-primary text-primary-foreground"
																	: "bg-muted text-foreground"
															}`}
														>
															<p className="text-sm">
																{msg.text}
															</p>
															<p className="text-xs opacity-70 mt-1">
																{msg.time}
															</p>
														</div>
													</div>
												)
											)
										) : (
											<div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
												No messages yet.
											</div>
										)}
									</div>

									{/* Input bar ALWAYS at bottom */}
									<div className="flex gap-2 pt-2 border-t border-border">
										<input
											type="text"
											placeholder="Type a message..."
											value={messageInput}
											onChange={(e) =>
												setMessageInput(e.target.value)
											}
											onKeyDown={(e) => {
												if (e.key === "Enter")
													handleSendMessage();
											}}
											className="flex-1 px-3 py-2 border border-border rounded-lg bg-input text-foreground"
											disabled={callState !== "idle"}
										/>
										<Button
											onClick={handleSendMessage}
											disabled={
												!messageInput.trim() ||
												callState !== "idle"
											}
										>
											Send
										</Button>
									</div>
								</>
							) : (
								<div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
									No messages yet.
								</div>
							)}
						</div>
					</div>
				</TabsContent>
				<TabsContent value="video">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-lg font-semibold text-foreground">
									Video calling
								</p>
								<p className="text-sm text-muted-foreground">
									Start a quick video check-in with the
									patient.
								</p>
							</div>
							{callState === "idle" && (
								<Button
									onClick={handleInitiateCall}
									className="bg-green-600 hover:bg-green-700 text-white"
								>
									Start Video Call
								</Button>
							)}
						</div>
						{callState !== "idle" && (
							<Card className="p-4 bg-linear-to-r from-blue-50 to-purple-50 border-blue-200">
								<div className="flex flex-col gap-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="font-semibold text-foreground">
												{callState === "ringing"
													? "Calling..."
													: "Connected"}
											</p>
											<p className="text-sm text-muted-foreground">
												{callState === "ringing"
													? "Waiting for response..."
													: formatCallDuration(
															callDuration
													  )}
											</p>
										</div>
									</div>
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
												<div className="text-4xl">
													🎥
												</div>
												<p className="text-white text-sm">
													Video off
												</p>
											</div>
										)}
										<div className="absolute top-4 right-4 w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center border-2 border-white">
											<div className="text-center">
												<div className="text-3xl">
													👨‍⚕️
												</div>
												<p className="text-white text-xs mt-1">
													{selectedConversation?.name}
												</p>
											</div>
										</div>
									</div>
									<div className="flex items-center justify-center gap-4 mt-4">
										<Button
											onClick={() => setIsMuted(!isMuted)}
											variant={
												isMuted
													? "destructive"
													: "outline"
											}
											className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
											title={isMuted ? "Unmute" : "Mute"}
										>
											{isMuted ? "🔇" : "🎤"}
										</Button>
										<Button
											onClick={() =>
												setIsVideoOn(!isVideoOn)
											}
											variant={
												!isVideoOn
													? "destructive"
													: "outline"
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
						{consultations &&
							consultations.length > 0 && (
								<div>
									<p className="text-xs font-semibold text-muted-foreground mb-2">
										Call history
									</p>
									<div className="space-y-2">
										{consultations.map((call: CallHistory, idx: number) => (
											<div
												key={idx}
												className="flex items-center gap-3 p-2 rounded bg-muted/50"
											>
												<span className="text-lg">
													📹
												</span>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium text-foreground">
														Video consultation
													</p>
													<p className="text-xs text-muted-foreground">
														{call.date} • {call.duration}
													</p>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
					</div>
				</TabsContent>
			</Tabs>
		</Card>
	);
}

export default PatientMessages;

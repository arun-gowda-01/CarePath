import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { messageApi, patientApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { Message as ApiMessage } from "@/lib/types";
import { toast } from "sonner";

function Messages() {
	const { user } = useAuth();
	const [messageInput, setMessageInput] = useState("");
	const [conversations, setConversations] = useState<any[]>([]);
	const [selectedConversation, setSelectedConversation] = useState<any | null>(
		null
	);

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


		socket.on("message:new", handleNewMessage);
		socket.on("message:read", handleMessageRead);

		return () => {
			socket.off("message:new", handleNewMessage);
			socket.off("message:read", handleMessageRead);
		};
	}, [user, selectedConversation]);

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
					/>
					<Button
						onClick={handleSendMessage}
						disabled={!selectedConversation || !messageInput.trim()}
					>
						Send
					</Button>
				</div>
			</div>
		</div>
	);
}

export default Messages;
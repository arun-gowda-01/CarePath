import { Router } from "express";
import {
	sendMessage,
	getConversation,
	getConversationById,
	getAllConversations,
	markAsRead,
	deleteMessage,
} from "../controllers/message.controller.js";

const router = Router();

router.post("/send", sendMessage);
router.get("/conversation/:userId", getConversation);
router.get("/conversation-id/:conversationId", getConversationById);
router.get("/conversations", getAllConversations);
router.patch("/mark-read/:messageId", markAsRead);
router.delete("/message/:messageId", deleteMessage);

export default router;

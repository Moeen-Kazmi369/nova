import { Router } from 'express';
import {
  listChats,
  createChat,
  deleteChat,
  renameChat,
  getChatMessages,
  addMessageToChat,
  uploadFileToChat,
  uploadMessageWithFile,
  saveVoiceChat,
  appendVoiceChat,
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";
import multer from "multer";
import { speechToText } from "../controllers/speechController.js";

const router = Router();

const upload = multer({ dest: "uploads/" });

router.get("/list", protect, listChats);
router.post("/new", protect, createChat);
router.delete("/:chatId", protect, deleteChat);
router.patch("/:chatId/rename", protect, renameChat);
router.get("/:chatId/messages", protect, getChatMessages);
router.post("/:chatId/message", protect, addMessageToChat);
router.post("/speech-to-text", protect, upload.single("audio"), speechToText);
router.post(
  "/:chatId/upload",
  protect,
  upload.single("file"),
  uploadFileToChat
);
router.post(
  "/:chatId/upload-message",
  protect,
  upload.single("file"),
  uploadMessageWithFile
);
router.post("/voice-chat/save", protect, saveVoiceChat);
router.post("/voice-chat/append", protect, appendVoiceChat);
export default router; 
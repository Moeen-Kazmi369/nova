const express = require("express");
const userController = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();

router.use(protect); // Protect all user routes

// Get all active AI Models for sidebar
router.get("/models", userController.getAllAIModels);

// Get all conversations for logged-in user (sidebar)
router.get("/conversations", userController.getUserConversations);

// Route to create a new conversation
router.post("/conversations/new", userController.createNewConversation);

// Get all messages for a conversation by ID
router.get(
  "/conversations/:id/messages",
  userController.getConversationMessagesById
);

// Delete a conversation by ID
router.delete("/conversations/:id", userController.deleteConversationById);

// User text prompt with optional files and conversation handling
router.post("/chat/prompt", userController.userTextPrompt);

module.exports = router;

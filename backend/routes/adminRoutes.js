const express = require("express");
const adminController = require("../controllers/adminController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");
const router = express.Router();

// Protect all routes and authorize only admins
router.use(protect, authorizeRoles("admin"));

router.get("/users", adminController.getUsers);
router.delete("/users/:userId", adminController.deleteUser);

// AI Model CRUD
router.post("/models", adminController.createAIModel);
router.get("/modelsForAdmin", adminController.getAllAIModelsForAdmin);
router.put("/models/:id", adminController.updateAIModel);
router.delete("/models/:id", adminController.deleteAIModel);

// Admin playground (dynamic AI chat)
router.post("/playground/text-chat", adminController.adminPlaygroundTextChat);

module.exports = router;

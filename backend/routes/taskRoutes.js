const express = require("express");
const taskController = require("../controllers/taskController");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();

router.use(protect);

router.get("/profile", taskController.getOrCreateProfile);
router.patch("/profile", taskController.updateProfile);

router.get("/drafts", taskController.getTaskDrafts);
router.post("/drafts", taskController.createTaskDraft);
router.post("/drafts/:id/approve", taskController.approveTaskDraft);

module.exports = router;

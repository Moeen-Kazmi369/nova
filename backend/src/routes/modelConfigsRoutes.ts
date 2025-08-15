import { Router } from "express";
import { saveAndUpdate } from "../controllers/modelConfigsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// POST /api/model-configs/save
router.post("/save", saveAndUpdate);

export default router;

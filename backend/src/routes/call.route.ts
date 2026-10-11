import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getCallRecents, logCall } from "../controllers/call.controller.js";

const router = express.Router();

router.get("/recents", protectRoute, getCallRecents);
router.post("/log", protectRoute, logCall);

export default router;

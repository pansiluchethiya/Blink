import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getWidgetRecent } from "../controllers/widget.controller.js";

const router = Router();

router.get("/recent", protectRoute, getWidgetRecent);

export default router;

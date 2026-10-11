import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  sendRequest,
  acceptRequest,
  declineRequest,
  blockUser,
  getFriends,
  getPendingRequests,
  matchContacts,
} from "../controllers/friendship.controller.js";

const router = express.Router();

router.post("/request", protectRoute, sendRequest);
router.post("/accept", protectRoute, acceptRequest);
router.post("/decline", protectRoute, declineRequest);
router.post("/block", protectRoute, blockUser);
router.get("/", protectRoute, getFriends);
router.get("/requests", protectRoute, getPendingRequests);
router.post("/match", protectRoute, matchContacts);

export default router;

import express from "express";
import { getUsersForSidebar,getMessages,sendMessage } from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router=express.Router();

router.get("/users",protectRoute,getUsersForSidebar); //The bunch of chat room Id's we're talking to
router.get("/:id",protectRoute,getMessages);

router.post("/send/:id",protectRoute,sendMessage);
export default router;
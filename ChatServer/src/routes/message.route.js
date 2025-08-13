import express from "express";
import { getMessages, postMessage, getUsersForSidebar} from "../controllers/message.controller.js";

const router=express.Router();

///chat/messages:
//these are non-real time endpoints:

//display all messages:
//router.get("/:sessionId",authenticateParticipant,getMessages);

router.get("/sessions",getUsersForSidebar); 
router.get("/:sessionId",getMessages);
router.post("/:sessionId",postMessage);
export default router;

//realtime endpoints to be made with socket.io, and it would also store those messages on redis
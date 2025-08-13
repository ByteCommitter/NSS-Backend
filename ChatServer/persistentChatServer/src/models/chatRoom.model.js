import mongoose from "mongoose";

const ChatRoomSchema = new mongoose.Schema(
    {
        chatRoomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        paricipants: {
            type: List,
            required: true,
        },
        timeToLive:{
            type: TimeRanges,
        }
    },
);

const ChatRoom = mongoose.model("ChatRoom", ChatRoomSchema);

export default ChatRoom;
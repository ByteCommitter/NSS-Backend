import Message from "../models/message.model.js";
import User from "../models/user.model.js";

export const getUsersForSidebar= async(req,res)=>{
    try{
        const loggedInUserId=req.user._id;
        const filteredUser= await User.find({_id:{$ne:loggedInUserId}});

        res.status(200).json(filteredUser);
    }
    catch(error){
        console.error("error in Getting Users",error.message);
        res.status(500).json({"message":"Internal Server Error"});
    }   
}

export const getMessages= async(req,res)=>{
    try{
        const {id:userToChatId}=req.params;
        const senderId=req.user._id;
        console.log(`${userToChatId} is the person we're speaking to\nI am ${senderId}`);
        const messages= await Message.find({
            $or:[
                {senderId:senderId, recieverId:userToChatId},
                {senderId:userToChatId,recieverId:senderId}
            ]
        });
        res.status(200).json(messages);
    }
    catch(err){
        console.log("Unable to retrieve messages ",err);
        res.status(500).json({error:"Internal Server Error"});
    }
}

export const sendMessage=async(req,res)=>{
    try{
        const {text,image} =req.body;
        const {id:recieverId}= req.params;

        const senderId=req.user._id;
        
        let imageUrl;

        const newMessage= new Message({
            senderId,
            recieverId,
            text,
            image:imageUrl
        })

        await newMessage.save();
        res.status(201).json(newMessage);
    }
    catch(error){
        console.log("Error sending message ",error);
        res.status(500).json({message:"Internal Server Error"});
    }
}
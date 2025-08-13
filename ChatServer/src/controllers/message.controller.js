import Redis from 'ioredis'
import Message from '../models/message.model.js';
import dotenv from 'dotenv';
dotenv.config();


const client = new Redis(process.env.REDIS_URL);

export const getUsersForSidebar = async(req,res)=>{
    try{
        const id = req.user.id;
        const name= req.user.name;

        // we'll return the sessionIds and roomNames as two lists in the response...
        const sessionList= await client.lrange(`${id}@${name}:sessions`,0,-1);
        
        //TODO: In the frontend, as soon as we recieve the users for the sidebar, immediately map the roomName to the sessionId, it wouid save time

        let roomNames=[];

        //The below is not optimal...
        // for(const i of sessionList){
        //     const rname=await client.hget(`sessionName:${i}`,'roomName');
        //     roomNames.push(rname);
        // }

        roomNames=await Promise.all(
            sessionList.map(sessionId=>
                client.hget(`sessionName:${sessionId}`,'roomName')
            )
        );


        res.status(200).json({
            "roomNames":roomNames,
            "sessionIds":sessionList
        })

    }
    catch(error){
        console.log("Unable to get users:\n",error);
        return res.status(500).json({message:"Internal Server Error"});
    }
};


export const postMessage =async(req,res)=>{
    try{
        const  {sessionId}=req.params;
        console.log(`posting message into ${sessionId}`);
        
        const {message} =req.body;
        const id=req.user.id;
        const name=req.user.name;

        //is user in the participants list?
        const roomName= await client.hget(`sessionName:${sessionId}`,'roomName');
        const data = await client.hget(`roomName:${roomName}`, 'participants');
        const participants = JSON.parse(data);
        const isAllowed = participants.some(p => p.id === id);

        if(!isAllowed){
            console.log("participant not allowed in this chat");
            return res.status(403).json({message:"Forbidden"});
        }
        const newMessage= new Message(id,name,sessionId,message,new Date().toISOString());

        await client.rpush(`${sessionId}:messages`,JSON.stringify(newMessage));

        res.status(201).json({sucess:true,message:"Message created"});
    }catch(error){
        console.log("Error sending message:\n",error);
        return res.status(500).json({message:"Internal Server Error"});
    }
};


export const getMessages =async(req,res)=>{
    try{
        const{ sessionId }=req.params;
        console.log(`Getting message from session: ${sessionId}`);
        
        const messages=await client.lrange(`${sessionId}:messages`,0,-1);
        const parsedMessages=messages.map(msg=>JSON.parse(msg));

        res.status(200).json({messages:parsedMessages});
    }catch(error){
        console.log("Error getting message:\n",error);
        return res.status(500).json({message:"Internal Server Error"});
    }
};
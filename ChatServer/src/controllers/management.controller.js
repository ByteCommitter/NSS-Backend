import Redis from 'ioredis'
import Message from '../models/message.model.js';
import dotenv from 'dotenv';
dotenv.config();


const client = new Redis(process.env.REDIS_URL);


export const createSession=async(req,res)=>{
    try{
        const {roomName,roomSessionId,participants}= req.body;
        //post the session Room details to chat microservice using axios
        

        //user can't set the same roomName for two sessions
        const roomNameExists= await client.exists(`roomName:${roomName}`);
        if(roomNameExists){
            console.log("Can't create room with same name");
            return res.status(409).json({message:"Can't create room with same name"});
        }
        console.log("Creating new Room");

        
        //TODO: use the revised Redis data structures to store room metadata and participant meta data.
        participants.push({id:"admin",name:"Admin"});
        //set metadata for roomName
        await client.hset(`roomName:${roomName}`,{
            sessionId:roomSessionId,
            participants:JSON.stringify(participants)
        });

        await client.hset(`sessionName:${roomSessionId}`,'roomName',roomName);

        console.log("Created Room Metadata");
        
        //set messages hash for sessionId
        const firstMessage= new Message({},{},{},{},{});
        await client.rpush(`${roomSessionId}:messages`,JSON.stringify(firstMessage));

        console.log("Pushed first Message into messages");
        
        //more optimal way to loop through participants...
        await Promise.all(
            participants.map(p=>
                client.rpush(`${p.id}@${p.name}:sessions`,roomSessionId)
            )
        );
        
        const TTL= 7*24*3600;
        await client.expire(`${roomSessionId}:messages`,TTL);
        await client.expire(`roomName:${roomName}`,TTL);
        await client.expire(`sessionName:${roomSessionId}`,TTL);

        res.status(201).json({message:"Created room with participants"});
    }
    catch(error){
        console.log("Unable to create room : ",error);
        return res.status(500).json({message:"Internal Server Error"});
    }
};

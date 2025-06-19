import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import http from 'http';
import authMiddleWare  from './authMiddleware.js';
import {Server as SocketIOServer} from 'socket.io'


const PORT= 8991;
const app=express();

const redis = new Redis(process.env.REDIS_URL);


redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

//Socket.io needs specific functionality for it to be working on a underlying http server
const server= http.createServer(app);
const io=new SocketIOServer(server,{
    cors:{
        origin:'*',
        methods:['GET','POST'],
    }
});

//set this up once, think of a case when an admin post mutltiple notifications
io.on('connection',(socket)=>{
        console.log('Connected');
        socket.on('disconnect',()=>{
            console.log('Client Disconnected');
        })
    })


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // adjust for campus network
  standardHeaders: true
});

app.use(limiter);


app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// allows me to have a frontend as the web as well...
// app.use(cors({
//   origin: '*', // During development you can use * but restrict this in production
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

app.use(express.json());

app.get('/',(req,res)=>{
    console.log('Notification server is ready!');
    res.send('Notification server is live');
})

//the notification server has to be subscirbed to the redis server sending the data from the backend

const main = () => {
    redis.subscribe("notifications", (err, count) => {
        if(err) {
            console.log(err);
            console.log("Unable to subscribe to notifications");
        } else {
            console.log(`Subscribed to ${count} channel(s). Listening for updates...`);
        }
    });

    redis.on("message", (channel, message) => {
        console.log(`Received message from ${channel}`);
        try {
            // Parse the message as JSON
            const parsedMessage = JSON.parse(message);
            console.log('Parsed message:', parsedMessage);
            
            // Extract the required fields or use defaults
            const { title, message: content, time, isRead } = parsedMessage;
            
            // Emit to all connected clients
            io.emit('pushNotification', {
                title,
                message: content,
                time,
                isRead
            });
            console.log('Notification pushed to clients');
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
}

// Call the main function to start subscription
main();



app.post('/send',(req,res)=>{
    const {title,message,time,isRead}=req.body;
    
    if (!title || !message) {
        return res.status(400).json({error: "Missing required fields"});
    }
    
    io.emit('pushNotification',{
        title,
        message,
        time,
        isRead
    })
    res.status(200).send({"message":"Notification sent"});

    
});

server.listen(PORT,()=>{
    console.log(`server is ready on PORT:${PORT}`);
})


process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    redis.quit();
    process.exit(0);
  });
});
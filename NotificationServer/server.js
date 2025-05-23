import express from 'express';
import cors from 'cors';
import http from 'http';
import authMiddleWare  from './authMiddleware.js';
import {Server as SocketIOServer} from 'socket.io'


const PORT= 8991;
const app=express();

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

// allows me to test flutter on the web while having a localhost backend as well...
app.use(cors({
  origin: '*', // During development you can use * but restrict this in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get('/',(req,res)=>{
    console.log('Notification server is ready!');
    res.send('Notification server is live');
})

app.post('/send',authMiddleWare,(req,res)=>{
    const {id,title,message,time,isRead}=req.body;
    console.log(`${message} is the message pushed`);
    
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

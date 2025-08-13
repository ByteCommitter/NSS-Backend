
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { protectRoute } from './middleware/auth.middleware.js';
import messageRoutes from "./routes/message.route.js";
import managementRoutes from './routes/management.route.js';
import dotenv from 'dotenv';
dotenv.config();

//uncomment when moving to sockets
//import {app,server} from "./lib/socket.js";


const app=express();
const PORT= process.env.PORT;


//TODO : Fix this in prod:
app.use(cors({
  origin: '*', // During development you can use * but restrict this in production
  methods: ['GET', 'POST', 'PUT', 'DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet());
app.use(express.json());

app.get("/health",(req,res)=>{
    res.status(200).json({status:"ok"});
})

app.use("/chat/message",protectRoute,messageRoutes);
app.use("/chat/management",managementRoutes);
//change to server, when moving to sockets...
app.listen(PORT,()=>{
    console.log(`Server is running on PORT: ${PORT}`);
});

import express from 'express';
import cors from 'cors';
import path,{dirname} from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js'
import eventRoutes from './routes/eventRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import maintenanceRoutes from './routes/maintenanceRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import dashBoardRoutes from './routes/dashBoardRoutes.js';
import auth from './middleware/authMiddleware.js';
import createFirstAdmin from './middleware/adminSetup.js';


const PORT= process.env.PORT || 8081;
const app=express();

const __filename=fileURLToPath(import.meta.url)
const __dirname=dirname(__filename)
//Middleware to tell express to serve all files from the public folder  as static assets

// app.use(express.static(path.join(__dirname,'../public')))
//cross origin resource sharing - cors
// allows me to test flutter on the web while having a localhost backend as well...
app.use(cors({
  origin: '*', // During development you can use * but restrict this in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

//gives the website our HTML file
// app.get('/',(req,res)=>{
//     res.sendFile(path.join(__dirname,'public','index.html'));
// });

const {authMiddleWare,verifyAdmin}=auth;

// Call the function directly to create admin during startup
createFirstAdmin();

//Routes
app.use('/auth',authRoutes);
//we need to add middleware here that authenticates the user to access this
//app.use('/todos',authMiddlware)// the below line is equivalent
app.use('/events',authMiddleWare,eventRoutes);
app.use('/notifications',authMiddleWare,notificationRoutes);
app.use('/admin',authMiddleWare,verifyAdmin,adminRoutes);
app.use('/dashboard',authMiddleWare,dashBoardRoutes);
app.use('/maintenance',authMiddleWare,maintenanceRoutes);

app.listen(PORT,()=>{
    console.log(`Server is ready on PORT: ${PORT}`);
});
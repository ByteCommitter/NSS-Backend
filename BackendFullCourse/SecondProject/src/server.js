import express from 'express';
import cors from 'cors';
import path,{dirname} from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js'
import eventRoutes from './routes/eventRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import authMiddleware from './middleware/authMiddleware.js'
import notificationRoutes from './routes/notificationRoutes.js'
const PORT= process.env.PORT || 8081;
const app=express();

const __filename=fileURLToPath(import.meta.url)
const __dirname=dirname(__filename)
//Middleware to tell express to serve all files from the public folder  as static assets

app.use(express.static(path.join(__dirname,'../public')))
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

//Routes
app.use('/auth',authRoutes);
//we need to add middleware here that authenticates the user to access this
//app.use('/todos',authMiddlware)// the below line is equivalent
app.use('/events',authMiddleware,eventRoutes);
app.use('/notifications',authMiddleware,notificationRoutes);
app.use('/admin',authMiddleware,adminRoutes);
app.use('/maintenance',authMiddleware,eventRoutes);

app.listen(PORT,()=>{
    console.log(`Server is ready on PORT: ${PORT}`)
});
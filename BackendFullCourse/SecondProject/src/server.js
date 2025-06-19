import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js'
import eventRoutes from './routes/eventRoutes.js'
import maintenanceRoutes from './routes/maintenanceRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import dashBoardRoutes from './routes/dashBoardRoutes.js';
import auth from './middleware/authMiddleware.js';
import createFirstAdmin from './middleware/adminSetup.js';


const PORT= process.env.PORT || 8081;
const app=express();

app.use(helmet());
//Middleware to tell express to serve all files from the public folder  as static assets

//TODO : Fix this in prod:
app.use(cors({
  origin: '*', // During development you can use * but restrict this in production
  methods: ['GET', 'POST', 'PUT', 'DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// Rate limiting
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);


app.use(express.json());

//gives the website our HTML file
// app.get('/',(req,res)=>{
//     res.sendFile(path.join(__dirname,'public','index.html'));
// });

const {authMiddleWare,verifyAdmin}=auth;

// Call the function directly to create admin during startup
createFirstAdmin();

//health of server:
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

//Routes
app.use('/auth',authRoutes);
//we need to add middleware here that authenticates the user to access this
//app.use('/todos',authMiddlware)// the below line is equivalent
app.use('/events',authMiddleWare,eventRoutes);
app.use('/notifications',authMiddleWare,notificationRoutes);
app.use('/dashboard',authMiddleWare,dashBoardRoutes);
app.use('/maintenance',authMiddleWare,maintenanceRoutes);


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const server=app.listen(PORT,()=>{
    console.log(`Server is ready on PORT: ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
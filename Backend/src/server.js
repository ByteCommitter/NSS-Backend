import express from 'express';
import path,{dirname} from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js'
import todoRoutes from './routes/todoRoutes.js'
import authMiddleware from './middleware/authMiddleware.js'

const PORT= process.env.PORT || 8151;
const app=express();

const __filename=fileURLToPath(import.meta.url)
const __dirname=dirname(__filename)
//Middleware to tell express to serve all files from the public folder  as static assets

app.use(express.static(path.join(__dirname,'../public')))

app.use(express.json());

//gives the website our HTML file
app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'public','index.html'));
});

//Routes
app.use('/auth',authRoutes);
//we need to add middleware here that authenticates the user to access this
//app.use('/todos',authMiddlware)// the below line is equivalent
app.use('/todos',authMiddleware ,todoRoutes);

app.listen(PORT,()=>{
    console.log(`Server is ready on PORT: ${PORT}`)
});
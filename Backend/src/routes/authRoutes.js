import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../prismaClient.js'

const router=express.Router();

//we encrypt the password and save the encryptes password
// and save this in the db, if equal then we're safe

router.post('/login',async(req,res)=>{
    let {username,password}=req.body;

    //check the username and password which is hashed
    //with db and log them into the app.
    console.log(`${username} is the username with paswd: ${password} recieved`)
    try{
        // const getUser=db.prepare(`
        //     SELECT * FROM USERS
        //     WHERE username=?
        // `)  
        //const user = getUser.get(username)
        
        //using Prisma:
        
        const user=await prisma.user.findUnique({
            where : {
                username:username
            }
        })

        console.log  (user);

        //Guard to check if user in db
        if(!user) { console.log('User Not found!');
                    return res.status(404).send({"message":'User Not Found!'});}
        console.log('User is present in db')

        //Guard to check if user has correct passwd
        const passwordIsValid=bcrypt.compareSync(password,user.PASSWORD);
        
        if(!passwordIsValid){
            console.log('Invalid password! Message sent to user');
            return res.status(401).send({"message":"Invalid password!"})
        }

        console.log('User entered valid password')
        //user is authenticated, we can move in...
        const token=jwt.sign({id:user.ID},process.env.JWT_SECRET,{expiresIn:'24h'})
        
        res.json({token})

        //user has new token
    }catch(err){
        console.log(err);
        res.sendStatus(503);
    }
});


router.post('/register', async (req,res)=>{
    let registerBody=req.body;
    console.log(`${registerBody.username} is the username and the password is ${registerBody.password}`);
    const hashedPassword=bcrypt.hashSync(registerBody.password,8);
    console.log(`${hashedPassword} is the hashed password`);
    
    //save user and hashedPassword to db
    try {
        //db.prepare us to inject values into the sql query
        // const insertUser=db.prepare(`
        //     INSERT INTO USERS(
        //         username,
        //         password
        //     )
        //     VALUES(?,?)
        //     `)
        // const result=insertUser.run(registerBody.username,hashedPassword);

        //db is 3rd party, so comm between server and db is asynchronous
        const user=await prisma.user.create({
            data:{
                username,
                password:hashedPassword
            }
        })
        
        console.log('User Inserted into database');

        //create a default todo in their lists
        const defaultToDo=`Hello :) Add your todos here`
        // const insertToDo=db.prepare(`
        //         INSERT INTO todos(user_id,task)
        //         VALUES(?,?)
        //     `)
        // insertToDo.run(result.lastInsertRowid,defaultToDo);
        
        //creating with prisma:
        const insertToDo=await prisma.todo.create({
            data:{
                task: defaultToDo,
                userId: user.id
            }
        })
        console.log('Default Insertions completed!');

        //create a token to modify only their todos...
        //authentication of users for specified actions
        const token=jwt.sign({id:user.id},process.env.JWT_SECRET,{expiresIn:'27h'})
        
        //the token is saved locally for the user...
        res.json({token});//sending back the token to the user
        console.log('Token sent to user')


    } catch(err){
        console.log(err.message);
        res.sendStatus(503);
    }
    
});

router.post('/logout',(req,res)=>{
    //the JWT tokens should be deleted
    //the 
})
export default router;
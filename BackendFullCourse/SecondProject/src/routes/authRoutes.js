import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const router=express.Router();

//we encrypt the password and save the encryptes password
// and save this in the db, if equal then we're safe

router.post('/login',(req,res)=>{
    let {id,password}=req.body;

    //check the username and password which is hashed
    //with db and log them into the app.
    console.log(`${id} is the id of the user with passwd: ${password} recieved`)
    try{
        const getUser=db.prepare(`
            SELECT * FROM users
            WHERE university_id=?
        `)  
        const user = getUser.get(id);//gets the entire row and is saved in user...
        console.log(user);

        //Guard to check if user in db
        if(!user) { console.log('User Not found!');
                    return res.status(404).send({"message":'User Not Found!'});}
        console.log('User is present in db')

        //Guard to check if user's db stored password has correct passwd
        const passwordIsValid=bcrypt.compareSync(password,user.password);
        
        if(!passwordIsValid){
            console.log('Invalid password! Message sent to user');
            return res.status(401).send({"message":"Invalid password!"})
        }

        console.log('User entered valid password')
        //user is authenticated, we can move in...
        const token=jwt.sign(
            { 
              id: id,  // Add the user ID to the token
              iat: Math.floor(Date.now() / 1000)
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
          );
        
        res.json({token})

        //user has new token
    }catch(err){
        console.log(err);
        res.sendStatus(503);
    }
});


router.post('/register',(req,res)=>{
    const {university_id,username,password}=req.body;
    console.log(`${university_id} is the id with ${username} as the username and the password is ${password}`);
    const hashedPassword=bcrypt.hashSync(password,8);
    console.log(`${hashedPassword} is the hashed password`);
    
    //save user and hashedPassword to db
    try {
        //db.prepare us to inject values into the sql query
        const insertUser=db.prepare(`
            INSERT INTO USERS(
                university_id,
                username,
                password,
                points,
                profile_image
            )
            VALUES(?,?,?,?,?)
            `)
        const result=insertUser.run(university_id,username,hashedPassword,0);
        console.log('User Inserted into database');

        //create a default todo in their lists
        // const defaultToDo=`Hello :) Add your todos here`
        // const insertToDo=db.prepare(`
        //         INSERT INTO todos(user_id,task)
        //         VALUES(?,?)
        //     `)
        // insertToDo.run(result.lastInsertRowid,defaultToDo);
        // console.log('Default Insertions completed!');

        //create a token to modify only their todos...
        //authentication of users for specified actions
        const token=jwt.sign({id:result.lastInsertRowid},process.env.JWT_SECRET,{expiresIn:'27h'})
        
        //the token is saved locally for the user...
        res.json({token});//sending back the token to the user
        console.log('Token sent to user')


    } catch(err){
        console.log(err.message);
        console.log('Error registering user into database! Possibly user is already registered');
        
        res.sendStatus(503);
    }
    
});

router.post('/logout',(req,res)=>{
    //the JWT tokens are deleted on the system

    //similarly the tokens should be deleted on hand

})
export default router;
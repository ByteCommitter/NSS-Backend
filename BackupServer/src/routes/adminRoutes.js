import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const router=express.Router();

//we encrypt the password and save the encryptes password
// and save this in the db, if equal then we're safe

router.post('/getUser',(req,res)=>{
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




export default router;
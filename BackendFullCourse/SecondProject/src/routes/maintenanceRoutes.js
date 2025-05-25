import express from 'express'
import db from '../db.js'

const router=express.Router();


//make a user an admin:

//This would be a high frequency trigger
router.put('/createAdmin',(req,res)=>{
 //user_event table should be updated
    const {university_id}=req.body;
   
    try{
        const registerUser=db.prepare(`
            UPDATE users SET isAdmin=1 WHERE university_id=?
            `)
        //isParticipated can be false also, test for this case
        registerUser.run(university_id);
        res.json({"message":"User successfully made admin"});
        console.log(`User ${university_id} is now admin`);
    }catch(err){
        console.log(err);
        console.log("Unable to verify user to event");
    }
});




//make the below routes be accessible through an admin's access only.

//get all users 
router.get('/users',(req,res)=>{
    const users=db.prepare(`
        SELECT * FROM users
        `)
    const result=users.getAll();
    res.status(200).send({result});
});

//get all volunteers
router.get('/volunteers',(req,res)=>{
    try{
        const volunteers=db.prepare(`
            SELECT * FROM users where isVolunteer = 1
            `)
        const result=volunteers.getAll();
        res.status(200).send({result});
    }catch(err){
        console.log(err);
        console.log('Unable to get volunteers from db');
        res.sendStatus(501);
    }
});

//delete user from 
router.delete('/users',(req,res)=>{
    const {university_id}=req.body;
    try{
        const removeUser=db.prepare(`
                DELETE FROM users where university_id=?
            `)    
        removeUser.run(university_id);
        res.json({"message":"User deleted from db"});
        res.sendStatus(203)
    }catch(err){
        console.log(err);
        console.log('Unable to delete user');
        res.sendStatus(501);
    }
});

export default router;
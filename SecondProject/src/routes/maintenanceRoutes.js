import express from 'express'
import db from '../db.js'
import auth from '../middleware/authMiddleware.js'

const router=express.Router();


//make a user an admin:

//This would be a high frequency trigger
router.put('/createAdmin',auth.verifyAdmin,(req,res)=>{
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
    const result=users.all();
    res.status(200).send({result});
});

//get all volunteers - ADMIN ONLY
router.get('/volunteers',auth.verifyAdmin,(req,res)=>{
    try{
        const volunteers=db.prepare(`
            SELECT * FROM users where isVolunteer = 1
            `)
        const result=volunteers.all();
        res.status(200).send({result});
    }catch(err){
        console.log(err);
        console.log('Unable to get volunteers from db');
        res.sendStatus(501);
    }
});

//get Volunteer Status
router.get('/volunteerStatus',(req,res)=>{
    const {id} = req.query;
    console.log(id);
    if (!id) {
        return res.status(400).json({ error: "Missing required parameter: id" });
    }
    
    try{
        const volunteers=db.prepare(`
            SELECT isVolunteer,isWishVolunteer FROM users where university_id=?
            `)
        const result=volunteers.get(id);
        console.log(result.isVolunteer);
        if(result.isVolunteer===1){
            res.status(200).json({"verificationStatus":1});//verified to be a volunteer
        }else if(result.isWishVolunteer===1){
            res.status(200).json({"verificationStatus":0});//yet to verified
        }else{
            res.status(200).json({"verificationStatus":-1});//for normal users who aren't volunteers
        }
        
    }catch(err){
        console.log(err);
        console.log('Unable to get volunteer status');
        res.status(501).send("Error getting data");//display as for normal users...
    }
});

//isWishVolunteer: - ANY USER
router.put('/wishVolunteer',(req,res)=>{
    const {university_id}=req.body;
    console.log(` ${university_id} requesting to become volunteer`);
    try{
        const wishVolunteer=db.prepare(`
            UPDATE users SET isWishVolunteer = 1 WHERE university_id=?
            `)
        wishVolunteer.run(req.userid);
        res.json({"isSuccess":true,"Message":"Registered to be a volunteer"});
    }catch(err){
        console.log(err);
        res.status(501).send("Unable to wishVolunteer");
    }
});

//makeVolunteer     - ADMIN ONLY
router.put('/makeVolunteer',auth.verifyAdmin,(req,res)=>{
    const {university_id}=req.body;
    console.log(`Making ${university_id} a volunteer...`);
    try{
        const makeVolunteer=db.prepare(`
            UPDATE users SET isVolunteer = 1, isWishVolunteer = 0 WHERE university_id=?
            `)
        makeVolunteer.run(university_id);
        res.json({"isSuccess":true,"Message":"User now a volunteer"});
    }catch(err){
        console.log(err);
        res.status(501).send({"isSuccess":false,"message":"Unable to make Volunteer"});
    }
});

router.put('/removeVolunteer',auth.verifyAdmin,(req,res)=>{
    const {university_id}=req.body;
    console.log(`Making ${university_id} a volunteer...`);
    try{
        const makeVolunteer=db.prepare(`
            UPDATE users SET isVolunteer = 0, isWishVolunteer = 0 WHERE university_id=?
            `)
        makeVolunteer.run(university_id);
        res.json({"isSuccess":true,"Message":"User now removed as volunteer"});
    }catch(err){
        console.log(err);
        res.status(501).send({"isSuccess":false,"message":"Unable to make Volunteer"});
    }
});


//delete user from 
router.delete('/users',auth.verifyAdmin,(req,res)=>{
    const {university_id}=req.body;
    try{
        const removeUser=db.prepare(`
                DELETE FROM users where university_id=?
            `)    
        removeUser.run(university_id);
        const removeUserTiedEvents=db.prepare(`
            DELETE FROM user_event WHERE user_id=?
            `)
        removeUserTiedEvents.run(university_id);
        res.json({"message":"User deleted from db"});
        res.sendStatus(203)
    }catch(err){
        console.log(err);
        console.log('Unable to delete user');
        res.sendStatus(501);
    }
});

export default router;
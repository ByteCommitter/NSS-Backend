import express from 'express'
import prisma from '../prismaClient.js'
import auth from '../middleware/authMiddleware.js'

const router=express.Router();


//make a user an admin:

//This would be a high frequency trigger
router.put('/createAdmin',auth.verifyAdmin,async(req,res)=>{
 //user_event table should be updated
    const {university_id}=req.body;
   
     try {
        const result = await prisma.user.update({
            where: {
                university_id: university_id
            },
            data: {
                isAdmin: true
            }
        });
        
        res.json({"message": "User successfully made admin"});
        console.log(`User ${university_id} is now admin`);
    } catch(err) {
        console.log(err);
        
        if (err.code === 'P2025') {
            return res.status(404).json({"message": "User not found"});
        }
        
        console.log("Unable to make user admin");
        res.status(500).json({"message": "Failed to update user"});
    }
});




//make the below routes be accessible through an admin's access only.

//No need for redis here as the request is only from admin
//get all users 
router.get('/users',auth.verifyAdmin,async(req,res)=>{
    try {
        const result = await prisma.user.findMany();
        res.status(200).send({result});
    } catch(err) {
        console.log(err);
        res.status(500).json({"message": "Failed to retrieve users"});
    }
});

//get all volunteers - ADMIN ONLY
router.get('/volunteers', auth.verifyAdmin, async (req, res) => {
    try {
        const result = await prisma.user.findMany({
            where: {
                isVolunteer: true
            }
        });
        res.status(200).send({result});
    } catch(err) {
        console.log(err);
        console.log('Unable to get volunteers from db');
        res.status(501).send("Server error");
    }
});

//get Volunteer Status
router.get('/volunteerStatus',async(req,res)=>{
    const {id} = req.query;
    console.log(id);
    if (!id) {
        return res.status(400).json({ error: "Missing required parameter: id" });
    }
    
    try{
        const result = await prisma.user.findUnique({
            where: {
                university_id: id
            },
            select: {
                isVolunteer: true,
                isWishVolunteer: true
            }
        });
        
        if (!result) {
            return res.status(404).json({ error: "User not found" });
        }
        
        console.log(result.isVolunteer);
        if(result.isVolunteer){
            res.status(200).json({"verificationStatus":1});//verified to be a volunteer
        }else if(result.isWishVolunteer){
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
router.put('/wishVolunteer',async(req,res)=>{
    const {university_id}=req.body;
    console.log(` ${university_id} requesting to become volunteer`);
    try{
        const result = await prisma.user.update({
            where: {
                university_id: req.userid // Using the authenticated user's ID
            },
            data: {
                isWishVolunteer: true
            }
        });
        res.json({"isSuccess":true,"Message":"Registered to be a volunteer"});
    }catch(err){
        console.log(err);
          
        if (err.code === 'P2025') {
            return res.status(404).json({"isSuccess": false, "message": "User not found"});
        }

        res.status(501).send("Unable to wishVolunteer");
    }
});

//makeVolunteer     - ADMIN ONLY
router.put('/makeVolunteer',auth.verifyAdmin,async(req,res)=>{
    const {university_id}=req.body;
    console.log(`Making ${university_id} a volunteer...`);
    try{
        const result = await prisma.user.update({
            where: {
                university_id: university_id
            },
            data: {
                isVolunteer: true,
                isWishVolunteer: false
            }
        });
        res.json({"isSuccess":true,"Message":"User now a volunteer"});
    }catch(err){
        console.log(err);

        if (err.code === 'P2025') {
            return res.status(404).json({"isSuccess": false, "message": "User not found"});
        }

        res.status(501).send({"isSuccess":false,"message":"Unable to make Volunteer"});
    }
});

router.put('/removeVolunteer',auth.verifyAdmin,async(req,res)=>{
    const {university_id}=req.body;
    console.log(`Removing ${university_id} as a volunteer...`);
    try{
        const result = await prisma.user.update({
            where: {
                university_id: university_id
            },
            data: {
                isVolunteer: false,
                isWishVolunteer: false
            }
        });

        res.json({"isSuccess":true,"Message":"User now removed as volunteer"});
    }catch(err){
        console.log(err);

        if (err.code === 'P2025') {
            return res.status(404).json({"isSuccess": false, "message": "User not found"});
        }

        res.status(501).send({"isSuccess":false,"message":"Unable to remove volunteer"});
    }
});


//delete user from 
router.delete('/users',auth.verifyAdmin,async(req,res)=>{
    const {university_id}=req.body;
    try{
        await prisma.$transaction([
            // First delete all user events
            prisma.userEvent.deleteMany({
                where: {
                    user_id: university_id
                }
            }),
            // Then delete the user
            prisma.user.delete({
                where: {
                    university_id: university_id
                }
            })
        ]);
        res.json({"message":"User deleted from db"});
    }catch(err){
        console.log(err);
        console.log('Unable to delete user');

        if (err.code === 'P2025') {
            return res.status(404).json({"message": "User not found"});
        }

        res.sendStatus(501);
    }
});

export default router;
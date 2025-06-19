import express from 'express'
import Redis from 'ioredis'
import prisma from '../prismaClient.js'
import auth from '../middleware/authMiddleware.js'

const router=express.Router();


const redis = new Redis(process.env.REDIS_URL);


// Note: @upstash/redis doesn't support event listeners
// Error handling will be done in the try/catch blocks

//we encrypt the password and save the encryptes password
// and save this in the db, if equal then we're safe

router.post('/',auth.verifyAdmin,async(req,res)=>{
  console.log('Publishing notification onto redis channel: notifications');
  const {id, title, message, time, isRead} = req.body;

  try {
      // First publish to Redis
      await redis.publish("notifications", JSON.stringify({title, message, time, isRead}));
      
      // Then store in database using Prisma
      const result = await prisma.notification.create({
          data: {
              title,
              message,
              time: new Date(time) // Convert string to Date object
          }
      });

      return res.status(201).send({ 
          success: true, 
          message: "Notification published",
          notification: result
      });
  } catch (error) {
      console.error("Error publishing notification:", error);
      return res.status(500).send({ success: false, message: "Failed to publish notification" });
  }
});



router.get('/', async (req, res) => {
  //fetch the notifications/eventUpdates from the database:
  try {
    const cachedEventUpdates= await redis.get("eventUpdates");
    if(cachedEventUpdates!==null){
      res.json(JSON.parse(cachedEventUpdates));
    }
    else{
      const result = await prisma.notification.findMany();
      redis.setex("eventUpdates",10,JSON.stringify(result));
      res.json({result});
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({"message": "Failed to fetch notifications"});
  }
});

router.delete('/', auth.verifyAdmin, async (req, res) => {
  try {
    const {id} = req.body;
    const notificationId = parseInt(id); // Convert to integer since Notification.id is Int in schema
    
    await prisma.notification.delete({
      where: {
        id: notificationId
      }
    });
    
    //redis delete:
    redis.del("eventUpdates");

    res.json({"isSuccess": true, "message": "Event Update Deleted!"});
  } catch (error) {
    console.error("Error deleting notification:", error);
    
    // Handle "not found" error specifically
    if (error.code === 'P2025') {
      return res.status(404).json({"isSuccess": false, "message": "Notification not found"});
    }
    
    res.status(500).json({"isSuccess": false, "message": "Failed to delete notification"});
  }
});


export default router;
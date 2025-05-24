import express from 'express'
import Redis from 'ioredis'
import db from '../db.js'

const router=express.Router();
const redis = new Redis({
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

//we encrypt the password and save the encryptes password
// and save this in the db, if equal then we're safe

router.post('/',(req,res)=>{
    console.log('Publishing notification onto redis channel: notifications');
    const {id, title, message, time, isRead} = req.body;
    console.log(`${id} is the notification ID received`);

    try {
        redis.publish("notifications", JSON.stringify({title, message, time, isRead}));
        return res.status(201).send({ success: true, message: "Notification published" });
    } catch (error) {
        console.error("Error publishing notification:", error);
        return res.status(500).send({ success: false, message: "Failed to publish notification" });
    }
    
/*Notification server reads:
    
{
  "title": "Notification",
  "message": "Notifs changed into updates.",
  "time": "2025-05-24T15:00:00Z",
  "isRead": false
}

*/
});




export default router;
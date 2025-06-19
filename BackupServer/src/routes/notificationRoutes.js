import express from 'express'
import Redis from 'ioredis'
import db from '../db.js'
import auth from '../middleware/authMiddleware.js'

const router=express.Router();


const redis = new Redis(process.env.REDIS_URL);


// Note: @upstash/redis doesn't support event listeners
// Error handling will be done in the try/catch blocks

//we encrypt the password and save the encryptes password
// and save this in the db, if equal then we're safe

router.post('/',auth.verifyAdmin,(req,res)=>{
  console.log('Publishing notification onto redis channel: notifications');
  const {id, title, message, time, isRead} = req.body;

  
  try {
      redis.publish("notifications", JSON.stringify({title, message, time, isRead}));
      
      //push into db for the notifications/eventUpdates
      const pushUpdates = db.prepare(`
        INSERT INTO notifications
        (title,message,time)
        VALUES(?,?,?)
        `)
      pushUpdates.run(title,message,time);

      return res.status(201).send({ success: true, message: "Notification published" });
  } catch (error) {
      console.error("Error publishing notification:", error);
      return res.status(500).send({ success: false, message: "Failed to publish notification" });
  }

});



router.get('/',(req,res)=>{
  //fetch the notifications/eventUpdates from the database:
  const eventUpdates=db.prepare(`
    SELECT * FROM notifications
    `)
  const result=eventUpdates.all();
  res.json({result});
});

router.delete('/',auth.verifyAdmin,(req,res)=>{
  try {
    const {id}=req.body;
    const deleteEvent=db.prepare( 
      `DELETE FROM notifications WHERE id=?`
    );
    const result = deleteEvent.run(id);
    
    if (result.changes > 0) {
      res.json({"isSuccess":true,"message":"Event Update Deleted!"});
    } else {
      res.status(404).json({"isSuccess":false,"message":"Notification not found"});
    }
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({"isSuccess":false,"message":"Failed to delete notification"});
  }
});


export default router;
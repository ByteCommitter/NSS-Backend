import express from 'express'
import db from '../db.js'
import auth from '../middleware/authMiddleware.js'
const router=express.Router();

//Dynamic query params in use:

// Th middleware makes sure the todos are authenticated. 
//The middleware deals with the req.body as we've seen earlier, so no need to do that

//GET

//This would be a high frequency trigger
//REDISIFY Here:
router.get('/',(req,res)=>{
    //console.log(req);
    //gets all existing ids
    //verify token and get all the todos
    const getEvents= db.prepare(`
            SELECT * FROM events where isSoftDelete=0
        `)
    const events=getEvents.all();//modified from middleware
    
    res.json({events});//we're hereby sending all the events asked for
});

//gets the information of the event givent the event ID.
router.post('/eventById',(req,res)=>{
    const {id}=req.body;
    try{const eventDetails=db.prepare(`
            SELECT * FROM events where id=? and isSoftDelete=0   
        `)
    const result=eventDetails.all(id);
    res.status(200).json({result});
    }catch(err){
        console.log(err);
        console.log("Unable to fetch event details");
        res.status(501).send("Unable to fetch event details");
    }
})


//POST - MOD ONLY - create a new event
router.post('/',auth.verifyAdmin,(req,res)=>{
    //creates a new id
    const {title,description,date,fromTime,toTime,eventVenue,banner_image,points}=req.body;

    const addEvent= db.prepare(`
            INSERT INTO events(title,description,date,fromTime,ToTime,eventVenue,banner_image,points)
            VALUES(?,?,?,?,?,?,?,?)
        `)
    
    addEvent.run(title,description,date,fromTime,toTime,eventVenue,banner_image,points);
    
    res.json({"message":"Event Added to Database"});
});


//Register for event- possible all users:
router.post('/user-event',(req,res)=>{
    //user_event table should be updated
    const {user_id,event_id}=req.body;
    console.log(`${req.userid} is the user ID of the user ${user_id} is the one rcvd on the API call`);
    console.log(`${event_id} is the event_id received`);
    //TODO fix this issue
    if(req.userid==user_id){
        console.log('Registering for event...');
    }
    else{
        console.log('Something went wrong');
        //return ;
    }

    try{
        //get the points from the event_id 
        const getPoints=db.prepare(`
            SELECT points from events where id = ?
            `)
        const points = getPoints.get(event_id);
        console.log(`${points.points} Points added to user_event table `);
        
        const registerUser=db.prepare(`
            INSERT INTO user_event(user_id,event_id,points)
            VALUES(?,?,?) 
            `)
        registerUser.run(user_id,event_id,points.points);
        res.json({"message":"User successfully registered"});
        console.log("User successfully registered to event");
    }catch(err){
        console.log(err);
        console.log("Unable to register user to event");
        res.json({"message":"User was not registered. Possibly already registered to event"});
    }
    
})


//VERIFY EVENT - BY MOD ONLY for users
router.put('/user-event',auth.verifyAdmin,(req,res)=>{
    
    //user_event table should be updated
    const {user_id,event_id,isParticipated}=req.body;

    // if(req.userid==user_id){
    //     console.log('Verifying...')
    // }
    // else{
    //     console.log('Something went wrong');
    //     return ;
    // }

    //first check if user is registered to event then update it
    
    try{
        const registerUser=db.prepare(`
            UPDATE user_event SET isParticipated = ? where
            user_id=? and event_id=?
            `)
        //isParticipated can be false also, test for this case
        registerUser.run(isParticipated,user_id,event_id);
        res.json({"message":"User successfully verified"});
        console.log("User has been verified for the event");

    }catch(err){
        console.log(err);
        console.log("Unable to verify user to event");
    }
})

//Redisify here?
//GET ALL REGISTERED USERS FOR EVENT and ALL eventsForUSER 
router.get('/user-event',(req,res)=>{
    //user_event table should be updated
    const queryType = req.query.query; // Get the query type from URL params
    if (queryType === "usersForEvents"){
        //gets the users registered for the events along with their participations status
        const event_id = req.query.event_id; // Get event_id from query params
        console.log(`${event_id} is the ID received and the ${queryType} is the specific query in use`);
    
        //guard to assert MOD from user
        console.log("Allowing Admin to access data...")
        console.log("Getting all the users registered to event");
        try{
            //user is authenticated by middleware to access this data
            const eventData = db.prepare(
                `SELECT user_id,isParticipated FROM user_event where event_id=?
                `
            )
            const result = eventData.all(event_id); // Use all() to get multiple rows
            console.log(JSON.stringify(result));
            res.json({result});
        }catch(err){
            console.log(err);
            console.log("Unable to get event data of user");
        }
        console.log("Sent data to admin regarding registered users");
    }
    else if(queryType === "eventsForUser"){
        //events registered by user to display in the home page
        const user_id = req.query.user_id; // Get user_id from query params
        console.log(`${user_id} is the ID received and the ${queryType} is the specific query in use`);
        try{
            //user is authenticated by middleware to access this data
            const eventData = db.prepare(
                `SELECT event_id FROM user_event where user_id=?
                `
            )
            const result = eventData.all(user_id); // Use all() to get multiple rows
        
             console.log(JSON.stringify(result));
            res.json({result});
        }catch(err){
            console.log(err);
            console.log("Unable to get event data of user");
        }
        console.log("Sent data - registered events by user")
    }else if(queryType === "eventsForUserParticipated"){
        
        //use this endpoint for rewards section
        const user_id = req.query.user_id; // Get user_id from query params
        console.log(`${user_id} is the ID received and the ${queryType} is the specific query in use`);
    
        console.log("Getting data for all events participated by user")
        try{
            //user is authenticated by middleware to access this data
            const eventData = db.prepare(
                `SELECT event_id FROM user_event
                WHERE user_id=? and isParticipated = 1
                `
            )
            const result = eventData.all(user_id); // Use all() to get multiple rows
            console.log(JSON.stringify(result));
            res.json({result});
        }catch(err){
            console.log(err);
            console.log("Unable to get event data of user");
        }
        console.log("Sent participated events to user");
    }
})


//UPDATE EVENT - MOD ONLY
router.put('/', auth.verifyAdmin,(req, res) => {
    console.log("Updating event...");
    try{
        const {id,title,description,date,fromTime,ToTime,eventVenue,banner_image}=req.body;
        console.log(id,title,description);
        const updateEvent=db.prepare(`
            UPDATE events
            SET title=?, description=?,
            date=?,fromTime=?,ToTime=?,eventVenue=?,
            banner_image=? WHERE id=?
            `)
        updateEvent.run(title,description,date,fromTime,ToTime,eventVenue,banner_image,id);
        res.json({"message":"Event Updated"});
    }catch(err){
        console.log(err);
        console.log("Unable to update event");
        res.status(501).send("Server is unable to delete from database");
    }
});

//soft- delete: - This is what mods would do generally
router.put('/softDelete',(req,res)=>{
    //the point of this API is just to clear the events present in the home page.
    try{
        const {id}=req.body;
        const deleteFromEvents=db.prepare(`
            UPDATE events SET isSoftDelete = 1 where id=? 
            `)
        deleteFromEvents.run(id);
        res.status(200).send("Deleted from the database");
    }catch(err){
        console.log(err);
        console.log("Unable to soft Delete");
        res.status(501).send("Server is unable to delete from database");
    }
});

//hard - delete from db: - maintenance API request
router.delete('/hardDelete',(req,res)=>{
    //This API clears all points for all users and the user must be warned of this- in this case the admin
    const {id} = req.body;
    const deleteFromEvents= db.prepare(`
        DELETE FROM events where id=?
        `);
    const deleteFromUserEvents=db.prepare(`
        DELETE FROM user_event where event_id=? 
        `);
    deleteFromEvents.run(id);
    deleteFromUserEvents.run(id);
    res.json({"message":"Deleted"});
})



export default router;
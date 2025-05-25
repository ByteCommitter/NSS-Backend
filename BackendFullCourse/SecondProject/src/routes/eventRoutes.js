import express from 'express'
import db from '../db.js'

const router=express.Router();

//Dynamic query params in use:

// Th middleware makes sure the todos are authenticated. 
//The middleware deals with the req.body as we've seen earlier, so no need to do that

//GET

//This would be a high frequency trigger
//ADD redis here:
router.get('/',(req,res)=>{
    //console.log(req);
    //gets all existing ids
    //verify token and get all the todos
    const getEvents= db.prepare(`
            SELECT * FROM events
        `)
    const events=getEvents.all();//modified from middleware
    
    res.json({events});//we're hereby sending all the events asked for
});

router.post('/eventById',(req,res)=>{
    const {id}=req.body;
    const eventDetails=db.prepare(`
            SELECT * FROM events where id=?    
        `)
    const result=eventDetails.all(id);
    res.status(200).json({result});
})


//POST - MOD ONLY - create a new event
router.post('/',(req,res)=>{
    //creates a new id
    const {title,description,date,fromTime,ToTime,eventVenue,banner_image}=req.body;

    const addEvent= db.prepare(`
            INSERT INTO events(title,description,date,fromTime,ToTime,eventVenue,banner_image)
            VALUES(?,?,?,?,?,?,?)
        `)
    
    const result= addEvent.run(title,description,date,fromTime,ToTime,eventVenue,banner_image);
    
    res.json({"message":"Event Added to Database"});
});

//High frequency api request
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
        const registerUser=db.prepare(`
            INSERT INTO user_event(user_id,event_id)
            VALUES(?,?) 
            `)
        registerUser.run(user_id,event_id);
        res.json({"message":"User successfully registered"});
        console.log("User successfully registered to event");
    }catch(err){
        console.log(err);
        console.log("Unable to register user to event");
        res.json({"message":"User was not registered. Possibly already registered to event"});
    }
    
})


//VERIFY EVENT - BY MOD ONLY for users
router.put('/user-event',(req,res)=>{
    
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


//GET ALL REGISTERED USERS FOR EVENT and ALL eventsForUSER 
router.get('/user-event',(req,res)=>{
    //user_event table should be updated
    const queryType = req.query.query; // Get the query type from URL params
    if (queryType === "usersForEvents"){
        const event_id = req.query.event_id; // Get event_id from query params
        console.log(`${event_id} is the ID received and the ${queryType} is the specific query in use`);
    
        //guard to assert MOD from user
        console.log("Allowing Admin to access data...")
        console.log("Getting all the users registered to event");
        try{
            //user is authenticated by middleware to access this data
            const eventData = db.prepare(
                `SELECT user_event.user_id, users.username, users.email 
                FROM user_event
                JOIN users ON user_event.user_id = users.id
                WHERE user_event.event_id=?
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
        const user_id = req.query.user_id; // Get user_id from query params
        console.log(`${user_id} is the ID received and the ${queryType} is the specific query in use`);
        try{
            //user is authenticated by middleware to access this data
            const eventData = db.prepare(
                `SELECT user_event.event_id, events.title, events.description, events.date
                FROM user_event
                JOIN events ON user_event.event_id = events.id
                WHERE user_event.user_id=?
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
router.put('/', (req, res) => {
    console.log("Updating event...");
    try{
        const {id,title,description,date,fromTime,ToTime,eventVenue,banner_image}=req.body;
        const updateEvent=db.prepare(`
            UPDATE TABLE events
            SET title=?, description=?,
            date=?,fromTime=?,ToTime=?,eventVenue=?,
            banner_image=? WHERE id=?
            `)
        updateEvent.run(title,description,date,fromTime,ToTime,eventVenue,banner_image,id);
        res.json({"message":"Event Updated"});
    }catch(err){
        console.log(err);
        console.log("Unable to soft Delete");
        res.status(501).send("Server is unable to delete from database");
    }
});

//soft- delete: - This is what mods would do generally
router.put('/softDelete',(req,res)=>{
    //the point of this API is just to clear the events present in the home page.
    try{
        const {event_id}=req.body;
        const deleteFromEvents=db.prepare(`
            UPDATE TABLE events SET isSoftDelete = 1 where event_id=? 
            `)
        deleteFromEvents.run(event_id);
    }catch(err){
        console.log(err);
        console.log("Unable to soft Delete");
        res.status(501).send("Server is unable to delete from database");
    }
});

//hard - delete from db: - maintenance API request
router.delete('/hardDelete',(req,res)=>{
    //This API clears all points for all users and the user must be warned of this- in this case the admin
    const {event_id} = req.body;
    const deleteFromEvents= db.prepare(`
        DELETE * FROM table events where event_id=?
        `)
    const deleteFromUserEvents=db.prepare(`
        DELETE * FROM user_events where event_id=? 
        `)
    deleteFromEvents.run(event_id);
    deleteFromUserEvents.run(event_id);
    res.json({});
})



export default router;
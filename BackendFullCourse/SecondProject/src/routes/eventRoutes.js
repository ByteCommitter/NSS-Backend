import express from 'express'
import prisma from '../prismaClient.js'
import auth from '../middleware/authMiddleware.js'
import Redis from 'ioredis'

const router=express.Router();

const redis = new Redis(process.env.REDIS_URL);

//Dynamic query params in use:


//This would be a high frequency trigger

router.get('/', async(req,res)=>{
    //console.log(req);
    //gets all existing ids
    //verify token and get all the todos
    try{
        const cachedEvents=await redis.get(`allEvents`);

        if(cachedEvents!==null){
            return res.json(JSON.parse(cachedEvents));
        }
        else{
            const events = await prisma.event.findMany({
                where: {
                    isSoftDelete: false
                }
            });
            //add to redis cache here:
            redis.setex(`allEvents`,50,JSON.stringify(events))
            res.json({events});
        }
    }catch(err){
        console.log(err);
        res.status(501).send("Unable to fetch events from server");
    }
});

//gets the information of the event givent the event ID.
router.post('/eventById', async(req,res)=>{
    const {id} = req.body;
    const eventId = parseInt(id); // Convert to integer since Event.id is Int in schema

    try {
        const cachedEventDetails = await redis.get(`eventDetails:${eventId}`);

        if(cachedEventDetails !== null) {
            return res.json(JSON.parse(cachedEventDetails));
        } else {
            // Use event (singular) to match the Event model name
            // Use findFirst instead of findMany since we need a specific event
            const eventDetails = await prisma.event.findFirst({
                where: {
                    id: eventId,
                    isSoftDelete: false
                }
            });
            
            if (!eventDetails) {
                return res.status(404).json({message: "Event not found"});
            }
            
            await redis.setex(`eventDetails:${eventId}`, 100, JSON.stringify(eventDetails));
            res.status(200).json({eventDetails});
        }
    } catch(err) {
        console.log(err);
        console.log("Unable to fetch event details");
        res.status(501).send("Unable to fetch event details");
    }
});


//POST - MOD ONLY - create a new event
router.post('/',auth.verifyAdmin,async(req,res)=>{
    //creates a new id
    const {title,description,date,fromTime,toTime,eventVenue,banner_image,points}=req.body;

    try {
        // Convert string dates to JavaScript Date objects if needed
        const dateObj = new Date(date);
        const fromTimeObj = new Date(fromTime);
        const toTimeObj = new Date(toTime);
        
        const result = await prisma.event.create({
            data: {
                title,
                description,
                date: dateObj,
                fromTime: fromTimeObj,
                toTime: toTimeObj,  // Note: case sensitive "toTime" not "ToTime"
                eventVenue,
                banner_image,
                points: points ? parseInt(points) : 50  // Use default if not provided
            }
        });
        
        // Clear the cached events since we've added a new one
        await redis.del('allEvents');
        
        res.json({"message": "Event Added to Database", "event": result});
    } catch (err) {
        console.error(err);
        res.status(500).json({"message": "Failed to add event to database"});
    }
});


//Register for event- possible all users:
router.post('/user-event',async(req,res)=>{
    //user_event table should be updated
    const {user_id,event_id}=req.body;
    
    const eventId = parseInt(event_id); // Convert to integer

    try {
        // First get the event to get its points
        const event = await prisma.event.findUnique({
            where: {
                id: eventId
            },
            select: {
                points: true
            }
        });
        
        if (!event) {
            return res.status(404).json({"message": "Event not found"});
        }
        
        console.log(`${event.points} Points added to user_event table`);
        
        // Register user to event
        const userEvent = await prisma.userEvent.create({
            data: {
                user_id: user_id,
                event_id: eventId,
                points: event.points
            }
        });
        
        res.json({"message": "User successfully registered"});
        console.log("User successfully registered to event");
    } catch(err) {
        console.log(err);
        console.log("Unable to register user to event");
        
        // Check if it's a unique constraint violation (user already registered)
        if (err.code === 'P2002') {
            return res.status(400).json({"message": "User is already registered for this event"});
        }
        
        res.status(400).json({"message": "User was not registered. Possibly already registered to event"});
    }
    
})


//VERIFY EVENT - BY MOD ONLY for users
router.put('/user-event',auth.verifyAdmin,async(req,res)=>{
    
    //user_event table should be updated
    const {user_id,event_id,isParticipated}=req.body;

    //first check if user is registered to event then update it
    //UPDATE: the above would work, rather only if the user registered, it would be in the user-event table
    
    const eventId = parseInt(event_id); // Convert to integer since event_id is Int in schema
    
    try {
        const participatedBoolean = isParticipated === true || isParticipated === 'true' || isParticipated === 1;
        // Update the user event participation status
        const result = await prisma.userEvent.update({
            where: {
                // Using the composite primary key
                user_id_event_id: {
                    user_id: user_id,
                    event_id: eventId
                }
            },
            data: {
                isParticipated: participatedBoolean
            }
        });
        
        res.json({"message": "User successfully verified"});
        console.log("User has been verified for the event");
    } catch(err) {
        console.log(err);
        console.log("Unable to verify user to event");
        
        // Better error handling
        if (err.code === 'P2025') {
            // Record not found
            return res.status(404).json({"message": "User is not registered for this event"});
        }
        
        res.status(500).json({"message": "Error updating participation status"});
    }
})

//Redisify here?
//GET ALL REGISTERED USERS FOR EVENT and ALL eventsForUSER 
router.get('/user-event',async(req,res)=>{
    //user_event table should be updated
    const queryType = req.query.query; // Get the query type from URL params
    if (queryType === "usersForEvents"){
        //gets the users registered for the events along with their participations status
        const event_id = req.query.event_id; // Get event_id from query params
        const eventId = parseInt(event_id); // Convert to integer since Event.id is Int in schema
    
        console.log(`${event_id} is the ID received and the ${queryType} is the specific query in use`);
        
        //guard to assert MOD from user
        console.log("Allowing Admin to access data...")
        console.log("Getting all the users registered to event");
        try {
            // Use Prisma to get all users registered for this event
            const result = await prisma.userEvent.findMany({
                where: {
                    event_id: eventId
                },
                select: {
                    user_id: true,
                    isParticipated: true
                }
            });
            
            console.log(JSON.stringify(result));
            res.json({result});
        } catch(err) {
            console.log(err);
            console.log("Unable to get event data of user");
            res.status(500).json({"message": "Failed to retrieve user data for event"});
        }
        console.log("Sent data to admin regarding registered users");
    }
    else if(queryType === "eventsForUser"){
        //events registered by user to display in the home page
        const user_id = req.query.user_id; // Get user_id from query params
        console.log(`${user_id} is the ID received and the ${queryType} is the specific query in use`);
        try{
            // Get all events for a specific user
            const result = await prisma.userEvent.findMany({
                where: {
                    user_id: user_id
                },
                select: {
                    event_id: true
                }
            });
        
            console.log(JSON.stringify(result));
            res.json({result});
        }catch(err){
            console.log(err);
            console.log("Unable to get event data of user");
            res.status(500).json({"message": "Failed to retrieve event data"});
        }
        console.log("Sent data - registered events by user");
    }else if(queryType === "eventsForUserParticipated"){
        
        //use this endpoint for rewards section
        const user_id = req.query.user_id; // Get user_id from query params
        console.log(`${user_id} is the ID received and the ${queryType} is the specific query in use`);

        console.log("Getting data for all events participated by user")
        try{
            // Get all participated events for a user
            const result = await prisma.userEvent.findMany({
                where: {
                    user_id: user_id,
                    isParticipated: true  // Prisma converts boolean to 1/0 for DB
                },
                select: {
                    event_id: true
                }
            });
            
            console.log(JSON.stringify(result));
            res.json({result});
        }catch(err){
            console.log(err);
            console.log("Unable to get event data of user");
            res.status(500).json({"message": "Failed to retrieve participated events"});
        }
        console.log("Sent participated events to user");
    }
})


//UPDATE EVENT - MOD ONLY
router.put('/', auth.verifyAdmin,async(req, res) => {
    console.log("Updating event...");
    try {
        const {id, title, description, date, fromTime, ToTime, eventVenue, banner_image} = req.body;
        const eventId = parseInt(id); // Convert to integer since Event.id is Int in schema
        
        console.log(id, title, description);
        
        // Note: "ToTime" from req.body is mapped to "toTime" in schema (lowercase 't')
        const result = await prisma.event.update({
            where: {
                id: eventId
            },
            data: {
                title,
                description,
                date: new Date(date),
                fromTime: new Date(fromTime),
                toTime: new Date(ToTime), // Note the case difference
                eventVenue,
                banner_image
            }
        });
        
        // Clear the cached events and this specific event's cache
        await redis.del('allEvents');
        await redis.del(`eventDetails:${eventId}`);
        
        res.json({"message": "Event Updated", "event": result});
    } catch(err) {
        console.log(err);
        console.log("Unable to update event");
        
        if (err.code === 'P2025') {
            return res.status(404).json({"message": "Event not found"});
        }
        
        res.status(501).send("Server is unable to update the event");
    }
});

//soft- delete: - This is what mods would do generally
router.put('/softDelete', auth.verifyAdmin, async (req, res) => {
    //the point of this API is just to clear the events present in the home page.
    try {
        const { id } = req.body;
        const eventId = parseInt(id); // Convert to integer since Event.id is Int in schema
        
        const result = await prisma.event.update({
            where: {
                id: eventId
            },
            data: {
                isSoftDelete: true
            }
        });
        
        // Clear Redis caches
        await redis.del('allEvents');
        await redis.del(`eventDetails:${eventId}`);
        
        res.status(200).json({ message: "Event successfully soft-deleted" });
    } catch (err) {
        console.log(err);
        console.log("Unable to soft Delete");
        
        if (err.code === 'P2025') {
            return res.status(404).json({ message: "Event not found" });
        }
        
        res.status(501).send("Server is unable to delete from database");
    }
});

//hard - delete from db: - maintenance API request
router.delete('/hardDelete', auth.verifyAdmin, async (req, res) => {
    //This API clears all points for all users and the user must be warned of this- in this case the admin
    const { id } = req.body;
    const eventId = parseInt(id); // Convert to integer
    
    try {
        // Use a transaction to ensure both operations succeed or fail together
        const result = await prisma.$transaction([
            // First delete all related user_event entries
            prisma.userEvent.deleteMany({
                where: {
                    event_id: eventId
                }
            }),
            // Then delete the event itself
            prisma.event.delete({
                where: {
                    id: eventId
                }
            })
        ]);
        
        // Clear Redis caches
        await redis.del('allEvents');
        await redis.del(`eventDetails:${eventId}`);
        
        res.json({ message: "Event and all related registrations permanently deleted" });
    } catch (err) {
        console.log(err);
        
        if (err.code === 'P2025') {
            return res.status(404).json({ message: "Event not found" });
        }
        
        res.status(500).json({ message: "Failed to delete event from database" });
    }
});



export default router;
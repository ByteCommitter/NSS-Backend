import express from 'express'
import db from '../db.js'

const router=express.Router();

//Dynamic query params in use:

// Th middleware makes sure the todos are authenticated. 
//The middleware deals with the req.body as we've seen earlier, so no need to do that

//GET

//This would be a high frequency trigger
router.get('/',(req,res)=>{
    console.log(req);
    //gets all existing ids
    //verify token and get all the todos
    const getEvents= db.prepare(`
            SELECT * FROM events
        `)
    const events=getEvents.all();//modified from middleware
    
    res.json({events});//we're hereby sending all the events asked for
});


//POST - MOD ONLY

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

//Register for event- possible all users:
router.post('/user-event',(req,res)=>{
    //user_event table should be updated
    const {user_id,event_id}=req.body;
    console.log(`${req.userid} is the user ID of the user`);
    //TODO fix this issue
    // if(req.userid==user_id){
    //     console.log('Registering for event...');
    // }
    // else{
    //     console.log('Something went wrong');
    //     return ;
    // }

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
                `SELECT user_id FROM user_event
                WHERE event_id=?
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
        
        console.log("Getting data for all events participated by user")
        try{
            //user is authenticated by middleware to access this data
            const eventData = db.prepare(
                `SELECT event_id FROM user_event
                WHERE user_id=?
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

router.put('/:id', (req, res) => {
    const { completed } = req.body;
    const { id } = req.params;
    
    try {
        const updatedToDo = db.prepare(`
            UPDATE todos SET completed = ? WHERE id = ?
        `);
        const result = updatedToDo.run(completed, id);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        
        res.json({ id, completed });
    } catch (error) {
        console.error('Update failed:', error);
        res.status(500).json({ error: 'Failed to update todo' });
    }
});

//update a task name
router.put('/:id/taskUpdate',(req,res)=>{
    //we're updating the id of the task
    const {task,completed}=req.body;
    const {id}=req.params;
    console.log(`Starting to update database on assigned Task ${id}`);
    
    const {page}=req.query;
    console.log(page);
    //We can get the information 
    //from the three ways - body, params or as a query
    const updatedToDo=db.prepare(`
                                UPDATE todos SET task=?,completed=?  WHERE id = ?                      
        `)
    const result=updatedToDo.run(task,completed,id);

    res.json({id:id,task,completed:1})
     
});

router.delete('/:id',(req,res)=>{
    //we have authorized the action from the user

    //we have recieved the taskIndex from the taskList to be deleted
    const {id}= req.params;// this id refers to the index no. of the todo to be deleted
    console.log(`Deleting todos from user with data: ${req.body}`);
    console.log(`Deleting task ${id}`);
    try{
        const toDelete=db.prepare(`
            DELETE FROM todos  WHERE id=? AND USER_ID=?
            `)
        toDelete.run(id,req.USERID);
    }catch(err){
        console.log(err);

    }
    res.json({"Message":`Task ${id} is deleted from database`});

});

export default router;
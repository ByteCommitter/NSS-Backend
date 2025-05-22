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
    }catch(err){
        console.log(err);
        console.log("Unable to register user to event");
    }
    res.json({"message":"User successfully registered"});
    console.log("User successfully registered to event");
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

    try{
        const registerUser=db.prepare(`
            INSERT INTO user_event(user_id,event_id,isParticipated)
            VALUES(?,?,?)
            `)
        //isParticipated can be false also, test for this case
        registerUser.run(user_id,event_id,isParticipated);
    }catch(err){
        console.log(err);
        console.log("Unable to verify user to event");
    }
    res.json({"message":"User successfully verified"});
    console.log("User has been verified for the event");
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
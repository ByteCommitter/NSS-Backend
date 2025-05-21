import express from 'express'
import db from '../db.js'

const router=express.Router();

//Dynamic query params in use:

//ids here are in reference to the table's todo list...

router.get('/',(req,res)=>{
    console.log(req); // Th middleware makes sure the todos are authenticated. 
    //The middleware deals with the req.body as we've seen earlier, so no need to do that

    //gets all existing ids
    //verify token and get all the todos
    const getToDos= db.prepare(`
            SELECT * FROM todos
            WHERE USER_ID=?
        `)
    const toDosUser=getToDos.all(req.USERID);//modified from middleware

    res.json(toDosUser);
});

router.post('/',(req,res)=>{
    //creates a new id
    const {task}=req.body;

    const addToDo=db.prepare(`
            INSERT INTO todos
            (user_id,task)
            VALUES(?,?)
        `)
    
    const result= addToDo.run(req.USERID,task);

    res.json({id:result.lastInsertRowid ,task,completed:0 });
});

//update task with completion
//update a task
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
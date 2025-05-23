import express from 'express'
import db from '../db.js'

const router=express.Router();

//Dynamic query params in use:

// Th middleware makes sure the todos are authenticated. 
//The middleware deals with the req.body as we've seen earlier, so no need to do that

//GET

//This would be a high frequency trigger
router.get('/users',(req,res)=>{
    console.log(req);
    //gets all existing ids
    //verify token and get all the todos
    const getEvents= db.prepare(`
            SELECT * FROM events
        `)
    const events=getEvents.all();//modified from middleware
    
    res.json({events});//we're hereby sending all the events asked for
});



export default router;
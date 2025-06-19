import express from 'express'
import db from '../db.js'
import Redis  from 'ioredis'


const router=express.Router();

const client = new Redis({
  url: 'https://sterling-tarpon-19557.upstash.io',
  token: 'AUxlAAIjcDFkMTg4OWIxODRkMmU0YTQ0OThhOWFkMjc0NGY5Yzk4YnAxMA',
})
//Add redis caching here first

//get the points scored in the points
router.get('/pointsScored',async (req,res)=>{
    
    const { user_id } = req.query; // GET method => use query, not body

    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    try{
        //does redis have the below information already? 
            const cachedPoints= await client.get(`points@${user_id}`)
            //use the above callbacks:
            if(cachedPoints!==null){
                console.log("Redis cache hit");
                console.log(cachedPoints);
                console.log(`${user_id} is the user whose points we hit`);
                return res.json({"points":JSON.parse(cachedPoints)});
            }
            else{
                console.log("Redis cache miss");
                const getPoints=db.prepare(`
                SELECT SUM(points) as totalPoints from user_event where isParticipated=1 and user_id=?
                    `)
                const pointsScored=getPoints.get(user_id);
                //redisify:
                client.setex(`points@${user_id}`,600,JSON.stringify(pointsScored.totalPoints || 0));
                
                res.json({"points":pointsScored.totalPoints || 0});
            }
    }catch(err){
        console.log(err);
        console.log("Unable to fetch points scored");
        res.status(501).send("Unable to fetch points scored");
    }
});

//get the topVolunteers
router.get('/topVolunteers',async (req,res)=>{
    
    try{
        //does redis have the below information already? 
            const cachedTopVolunteers= await client.get(`topThreeVolunteers`)
            //use the above callbacks:
            if(cachedTopVolunteers!==null){
                console.log("Redis cache hit");
                console.log(cachedTopVolunteers);
                return res.json({"topVolunteers":JSON.parse(cachedTopVolunteers)});
            }
            else{
                console.log("Redis cache miss");
                const getTopVolunteers=db.prepare(`
                SELECT u.username, SUM(ue.points) as totalPoints
                FROM user_event  ue, users u 
                WHERE isParticipated = 1 AND ue.user_id=u.university_id
                GROUP BY ue.user_id
                ORDER BY totalPoints DESC
                LIMIT 3
                    `)
                const topVolunteers=getTopVolunteers.all();
                console.log(topVolunteers);
                //redisify:
                client.setex(`topThreeVolunteers`,86400,JSON.stringify(topVolunteers));
                
                res.json({topVolunteers});
            }
    }catch(err){
        console.log(err);
        console.log("Unable to fetch points scored");
        res.status(501).send("Unable to fetch points scored");
    }
});

//get the participation list
router.get('/recentParticipations',async (req,res)=>{
    
    const { user_id } = req.query; // GET method => use query, not body
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    try{
        //does redis have the below information already? 
            const cachedParticipations= await client.get(`Participations@${user_id}`)
            //use the above callbacks:
            if(cachedParticipations!==null){
                console.log("Redis cache hit");
                console.log(cachedParticipations);
                console.log(`${user_id} is the user we hit`);
                return res.json({"Participations":JSON.parse(cachedParticipations)});
            }
            else{
                console.log("Redis cache miss");
                const getParticipations=db.prepare(`
                SELECT * 
                FROM user_event 
                where isParticipated=1 and user_id=?
                    `)
                const participations=getParticipations.all(user_id);
                //redisify:
                client.setex(`Participations@${user_id}`,600,JSON.stringify(participations));
                
                res.json({"Participations":participations});
            }
    }catch(err){
        console.log(err);
        console.log("Unable to fetch points scored");
        res.status(501).send("Unable to fetch points scored");
    }

});

//get the badges earned


export default router;
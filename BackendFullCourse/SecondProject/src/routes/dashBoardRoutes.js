import express from 'express'
import prisma from '../prismaClient.js'
import Redis  from 'ioredis'


const router=express.Router();

const client = new Redis(process.env.REDIS_URL);
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
                 // Prisma aggregate to sum points where user participated
                const pointsScored = await prisma.userEvent.aggregate({
                    _sum: {
                        points: true
                    },
                    where: {
                        user_id: user_id,
                        isParticipated: true
                    }
                });
                
                const totalPoints = pointsScored._sum.points || 0;
                
                //redisify:
                await client.setex(`points@${user_id}`, 600, JSON.stringify(totalPoints));
                
                res.json({"points": totalPoints});
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
                const userPoints = await prisma.userEvent.groupBy({
                    by: ['user_id'],
                    where: {
                        isParticipated: true
                    },
                    _sum: {
                        points: true
                    },
                    orderBy: {
                        _sum: {
                            points: 'desc'
                        }
                    },
                    take: 3
                });
                
                // Then get the usernames for these users
                const topVolunteers = await Promise.all(
                    userPoints.map(async (volunteer) => {
                        const user = await prisma.user.findUnique({
                            where: {
                                university_id: volunteer.user_id
                            },
                            select: {
                                username: true
                            }
                        });
                        
                        return {
                            username: user.username,
                            totalPoints: volunteer._sum.points || 0
                        };
                    })
                );
                
                console.log(topVolunteers);
                //redisify:
                await client.setex(`topThreeVolunteers`, 86400, JSON.stringify(topVolunteers));
                
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
                // Get all user event participations
                const participations = await prisma.userEvent.findMany({
                    where: {
                        user_id: user_id,
                        isParticipated: true
                    }
                });
                
                //redisify:
                await client.setex(`Participations@${user_id}`, 600, JSON.stringify(participations));
                
                res.json({"Participations": participations});
            }
    }catch(err){
        console.log(err);
        console.log("Unable to fetch participations");
        res.status(501).send("Unable to fetch participations");
    }

});


export default router;
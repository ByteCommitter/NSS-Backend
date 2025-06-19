import Redis from 'ioredis';
import admin from 'firebase-admin'
import serviceAccount from './firebase-service.json' assert { type: "json" }

const redis=new Redis({
    port: 6379,
    host: '127.0.0.1',
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

//if you're moving to Docker soon — you’d likely change '127.0.0.1' to 'redis' (service name in the Docker network).
admin.initializeApp({
    credential:admin.credential.cert(serviceAccount),
});


//subscribe to the Redis channel- notifications

redis.subscribe("notifications",(err,count)=>{
    if(err){
        console.log(err);
        process.exit(0);
    }
    console.log(`Subscribed to ${count} channels. Listening to Push Notifications`);
})


redis.on("message",async(channel,message)=>{
    console.log("Notification from redis channel - ", channel);

    try{
        const parsedMessage=JSON.parse(message);
        console.log('Parsed message:',parsedMessage);

        const {title,message:content,time,isRead}=parsedMessage;

        await admin.messaging().sendToTopic("all-users",{
            notification : {
                title,
                body: content,
            }
        });

        console.log("Notification pushed via FCM");
    }catch(err){
        console.log(err);
        console.log("Unable to get notifications from the redis server");
    }
})

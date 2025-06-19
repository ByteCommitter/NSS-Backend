
//initialise a server using express
const express=require('express');
const app=express();
//tell which port to listen to:

const PORT =8081

const data=[{
    name: "James"
}];
//have the http verbs/methods and routes here:(together make an endpoint)
//The method informs the nature of the request-- GET UPDATE DELETE
//The route is a subdirectory 

//Middleware - part of configuring the server
app.use(express.json());

// Website endpoints: (Specifically for sending back html code for users on browsers)
app.get('/',(req,res)=>{
    console.log('I hit the home route endpoint',req.method);
    res.send(`
            <body>
            <h1>Home</h1>
                <p>${JSON.stringify(data)}</p>
            <a href="/dashboard">dashboard</a>
            </body>`)
    res.sendStatus(201); //200-299 suggests that we got a successful response status
}) //the home route endpoint - /



app.get('/dashboard',(req,res)=>{
    console.log("Now at dashboard endpoint");
    res.send(`
        <body>    
        <h1>DashBoard</h1>
        <p>Enter the name of new user</p>
        <input/>
        <a href="/">Home Page</a>
        </body>   `);
    res.sendStatus(200);//defaulted to 200
});


//API endpoints (non-visual)://an app or a website gets these reqs and responses
app.get('/api/data',(req,res)=>{
    console.log('API Data endpo int');
    res.send(data);
});

app.post('/api/data',(req,res)=>{//creates a user when users clicks signup button
    //consider the req data here
    const newData=req.body
    console.log(`Recieved Data from user ${JSON.stringify(newData)}`);
    data.push(newData);
    console.log("\n The list of current users are:");
    for(let i=0;i<data.length;i++){
        console.log(data[i].name);
    }
    res.sendStatus(201);
});

//C-Create- post
//R-read- get
// U-update
// D-delete

app.delete('/api/endpoint',(req,res)=>{
    let nameToRemove=req.body.name;
    //let nameToRemove=objectBodyToRemove.name;
    console.log(`The recieved name to delete is :${nameToRemove}`)
    let isRemoved=false;
    //search for the name in the data array and delete it
    for(let i=0;i<data.length;i++){
        if(data[i].name==nameToRemove){
            data.splice(i, 1); // removes 1 element at that index
            console.log("Console says we identified element");
            res.send("Removed successfully"); 
              
            isRemoved=true;
            break;
        }
    }
    if(!isRemoved) res.send('Data not available to delete!');
    console.log("\n The list of current users are:");
    for(let i=0;i<data.length;i++){
        console.log(data[i].name);
    }
    
});
 
app.listen(PORT,()=>{
    console.log(`Server is on at port ${PORT}`);
}); // listen to incoming requests

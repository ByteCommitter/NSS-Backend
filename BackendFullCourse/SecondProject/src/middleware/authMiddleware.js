import jwt from 'jsonwebtoken'

//intercept it with out auth middleware to ensure that the token is for a valid and correct user

//the middleware intercepts and read the otkens from the header sent form the frontend

function authMiddleWare(req,res,next){
    //get the token from the req

    const token=req.headers['authorization'];
    //console.log(req.headers['authorization']);
    if(!token){
        console.log('Token is not provided');
        return res.status(401).send({"message":"No token provided"});
    }

    jwt.verify(token,process.env.JWT_SECRET,(err,decoded)=>{
        if(err){
            console.log("Invalid or expired Tokens");
            return res.status(401).send({"message":"Invalid Token"});
        }

        //decoded is one of the core params of the verified user
        //we're adding params to the incoming request by adding this:
        console.log('User action verified with JWT tokens');
        req.USERID=decoded.id
        next()//over to the next middleware function

    })

}

export default authMiddleWare;
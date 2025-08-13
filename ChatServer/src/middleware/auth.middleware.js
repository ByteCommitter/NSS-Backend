import jwt from "jsonwebtoken";

export const protectRoute = async(req,res,next)=> {
    try{
        const token = req.headers['authorization'];
        
        if (!token) {
            console.log('Token is not provided');
            return res.status(401).send({"message":"No token provided"});
        }
    
        jwt.verify(token, process.env.SHARED_JWT_KEY, (err, decoded) => {
            if (err) {
                console.log("Invalid or expired Tokens. Diagnose from main server");
                return res.status(401).send({"message":"Invalid Token"});
            }
    
            //console.log('User action verified with JWT tokens');
            
            if (!decoded.id) {
                console.log('ERROR: No user ID in token. Token was generated incorrectly.');
                return res.status(401).send({"message":"Invalid token format - missing user ID"});
            }
            
            // Set the user ID for use in routes
            req.user=decoded;
            
            next();
        });
    }catch(error){
        console.log("JWT Authentication went wrong:\n",error);
        return res.status(500).json({message:"Internal Server Error"});
    }
}
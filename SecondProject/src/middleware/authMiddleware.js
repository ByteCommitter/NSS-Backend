import jwt from 'jsonwebtoken'

function authMiddleWare(req, res, next) {
    const token = req.headers['authorization'];
    
    if (!token) {
        console.log('Token is not provided');
        return res.status(401).send({"message":"No token provided"});
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("Invalid or expired Tokens");
            return res.status(401).send({"message":"Invalid Token"});
        }

        console.log('User action verified with JWT tokens');
        //console.log('Decoded token:', decoded);
        
        if (!decoded.id) {
            console.log('ERROR: No user ID in token. Token was generated incorrectly.');
            return res.status(401).send({"message":"Invalid token format - missing user ID"});
        }
        
        // Set the user ID for use in routes
        req.user=decoded;
        req.userid = decoded.id;
        
        if(req.user.isAdmin) console.log(`${req.userid} is the admin`);
        console.log(`User ID from token: ${req.userid}`);
        
        next();
    });
}

function verifyAdmin(req,res,next){
    if(!req.user||!req.user.isAdmin){
        return res.status(403).send({"message":"Admin Access Only"});
    }
    next();
}


export default {authMiddleWare,verifyAdmin};
import jwt from "jsonwebtoken";
import User from '../models/user.model.js';

export const protectRoute= async(req,res,next)=> {
    try{
      const token=req.cookies.jwt;
        //cookie parser will help ujse parse the cookie content...

      if(!token){
        return res.status(401).json({"message":"Unauthorized action"});
      }

        const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY);

        if(!decoded){
            res.status(403).json({"message":"Forbidden Access for action"});
        }

        const user=await User.findById(decoded.userId).select("-password");//deslecting the password
        
        if(!user){
            return res.status(404).json({"message":"User not found"});
        }

        req.user=user;

        next()//onto the next function
    }
    catch(err){ 
        console.log("Error validating action: ",err);
        return res.status(500).json({"message":"Internal Server Error"});
    }
};

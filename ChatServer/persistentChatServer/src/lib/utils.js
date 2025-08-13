import jwt from "jsonwebtoken";

export const generateToken= (userId,res)=>{
    const token = jwt.sign({userId},process.env.JWT_SECRET_KEY,{expiresIn:"7d"});
    
    res.cookie("jwt",token,{
        maxAge: 7*24*60*60*1000,
        httpOnly: true, // prevents XSS attacks cross-site scripting attacks
        sameSite:"strict",// CSRF attakcs cross-site quest forgery attacks
        secure: process.env.NODE_ENV !== "development"//determines http or https
    });
    //the user is sent the cookie...

    return token;
};
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import { generateToken } from "../lib/utils.js";

export const signup=async (req,res)=>{
  const {fullName,email,password} = req.body;

  try{
    if(!fullName||!email||!password){
        return res.status(400).json({"message":"All fields are required"});
    }
    
    //we hash the password and then store the password
    
    const user=await User.findOne({email});

    if(user) return res.status(400).json({"message":"Email is already registered"});

    const salt= await bcrypt.genSalt(10);
    const hashedPassword= await bcrypt.hash(password,salt);

    const newUser= new User({
        fullName:fullName,
        email:email,
        password:hashedPassword
    });

    if(newUser){
        //generate new token here...
        generateToken(newUser._id,res);
        await newUser.save();
        res.status(201).json({
            _id:newUser._id,
            fullname:newUser.fullName,
            email:newUser.email,
            profilePic: newUser.profilePic
        })
    }
    else{
        res.status(400).json({"message":"Invalid User data"});
    }
  }
  catch(error){
    console.log(error);
    res.status(500).json({"message":"Internal Server error"});
  }
}

//connect with main server
export const connectServer=(req,res)=>{

};

export const login= async(req,res)=>{
    const {email,password} = req.body;
    try{
        const user=await User.findOne({email});

        if(!user){
            return res.status(404).json({"message":"Invalid Credentials"});
        }

        const isPasswordCorrect= await bcrypt.compare(password,user.password);
        
        if(!isPasswordCorrect){
            return res.status(400).json({"message":"Invalid credentials"});
        }

        generateToken(user._id,res);

        res.status(200).json({
            _id:user._id,
            fullName:user.fullName,
            email:user.email,
            profilePic:user.profilePic
        })

         
    }
    catch(error){
        console.log("Error Logging in: ",error);
        res.status(500).json({"message":"Internal Server Error"});
    }
}

export const logout=(req,res)=>{
    try{
        //clear out the cookies
        res.cookie("jwt","",{maxAge:0});
        res.status(200).json({"message":"Logged out successfully"});
    }
    catch(err){
        console.log("Error in logout: ",err);
        res.status(500).json({"message":"Internal Server Error"});
    }
}
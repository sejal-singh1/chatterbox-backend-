import jwt from "jsonwebtoken";
import { ErrorHandler } from "../utils/utility.js";
import { CHATTERBOX_TOKEN } from "../constants/config.js";
import { User } from "../models/userModels.js";


const isAuthenticated=(req,res,next)=>{
    try {
        const token=req.cookies[CHATTERBOX_TOKEN];
        if(!token) return next(new ErrorHandler("please login to acccess this route",401));

        const decodedData=jwt.verify(token,process.env.JWT_SECRET);
        
        req.user=decodedData._id;
        next();
    } catch (error) {
        next(error);
    }
}


const adminOnly = (req, res, next) => {
    try {
        
       
        // Retrieve token from cookies
        const token = req.cookies["chatterbox-admin-token"];
        
        if (!token) {
            return next(new ErrorHandler("Please log in as admin to access this route", 401));
        }

        // Verify token and extract decoded data
        const secretKey= jwt.verify(token, process.env.JWT_SECRET);
       
const adminSecretKey=process.env.ADMIN_SECRET_KEY || "SSSINGH123";


        const isMatched=secretKey === adminSecretKey;
        // Check if both email and password are provided
        
        if (!isMatched) return next(new ErrorHandler("Please log in as admin to access this route",401));
              
        
        next();
    } catch (error) {
        next(error);
    }
};



const socketAuthenticator=async(err,socket,next)=>{
try {
    
if(err) return next(err);
const authToken=socket.request.cookies[CHATTERBOX_TOKEN];
if(!authToken)  return next (new  ErrorHandler("Please login to access this route",401));
const decodedData=jwt.verify(authToken,process.env.JWT_SECRET);

const user=await User.findById(decodedData._id);
if(!user) return next (new  ErrorHandler("Please login to access this route",401));
socket.user=user;
next ();
}catch(error){
    console.log(error);
    return next (new  ErrorHandler("Please login to access this route",401));

}

};
export {isAuthenticated,adminOnly,socketAuthenticator};
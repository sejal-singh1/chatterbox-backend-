import { compare } from "bcrypt";
import { User } from "../models/userModels.js";
import { cookieOptions, emitEvent, sendTOken, uploadFilesToCloudinary } from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";
import {Chat} from "../models/chat.js";
import { Request } from "../models/request.js";
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
//Create  new user and save it to datatbase and save token and cookies
const newUser=async(req,res,next)=>{
    try{

    const { name,username,password,bio} =req.body;

const file=req.file


if(!file){

 return next(new ErrorHandler("please upload Avatar",400));
}

const result =await uploadFilesToCloudinary([file]);



    const avatar={
        public_id:result[0].public_id,
        url:result[0].url,
    };
    const user= await User.create({name:name, bio:bio,username:username,password:password,avatar:avatar});
    sendTOken(res,user,201,"User created");
} catch (error) {
    return next(new ErrorHandler(error.message, 500));
}
};



//login user and save token in cookie
const login=async(req,res,next)=>{
    try{
    const {username,password} =req.body;
const user=await User.findOne({username}).select("+password");
if(!user) return next(new ErrorHandler("Invalid Username or password",404));

const isMatch=await compare(password,user.password);
if(!isMatch) return  next(new ErrorHandler("Invalid Username or password",404));
 
sendTOken(res,user,200,`Welcome back,${user.name}`);
    }catch(error){
        next(error);
    }
};




//expess my profile
const getMyProfile=async(req,res,next)=>{
    try{
  const user=  await User.findById(req.user).select("-password");//this is id
res.status(200).json({
    success:true,
   user,
});
    }catch(error){
        next(error);
    }
};


//logout user
const logout=async(req,res,next)=>{
    try{
 
 return res.status(200).cookie("chatterbox-token","",
   {... cookieOptions,maxAge:0}
 ).json({
    success:true,
   message:"Logged out succesfully",
});
    }catch(error){
        next(error);
    }
};


//search the user route
const searchUser=async(req,res,next)=>{
    try{
 const {name =""}=req.query;

 const myChats=await Chat.find({//find our chat
    groupChat:false,
    members:req.user,
 });
 //all user from my chats means friends i have chatted it
 const allUsersFromMyChats=myChats.flatMap((chat)=>chat.members);

 const allUsersExpectMeAndFriends=await User.find({
    _id:{$nin:allUsersFromMyChats},
   name:{$regex:name,$options:"i"},
 });
 const users=allUsersExpectMeAndFriends.map(({_id,name,avatar} )=>({
_id,
name,
avatar:avatar.url,
 }));
 return res.status(200)
 .json({
    success:true,
  users,
});
    }catch(error){
        next(error);
    }
};



// Send friend request
 const sendFriendRequest = async (req, res, next) => {
    try {
        const { userId } = req.body;
         // Create a new friend request
         const request = await Request.findOne({
            $or:[
           {sender: req.user,receiver:userId},
            {sender: userId, receiver:req.user},
            ],
            
        });

        
        if (request) {
            return next(new ErrorHandler("Request already send", 400));
        }
         
            await Request.create({
            sender: req.user,
            receiver: userId,
        });
        emitEvent(req,NEW_REQUEST,[userId]);

       
       return res.status(201).json({
            success: true,
            message: "Friend request sent",
            
        });
    } catch (error) {
        next(error);
    }



 };

 
 
const acceptFriendRequest=async(req,res,next)=>{
    try {
       const {requestId,accept} =req.body;
       const request=await Request.findById(requestId)
       .populate("sender","name")
       .populate("receiver","name");

       if (!request) {
        return next(new ErrorHandler("Request Not Found", 400));
    }
     if(request.receiver._id.toString() !== req.user.toString())
         return next(new ErrorHandler("Unauthorized",401));

     if(!accept) {
        await request.deleteOne();

     
     return res.status(200).json({
        success: true,
        message: "Friend Request Reject  ",
        
    });
}
const members=[request.sender._id,request.receiver._id];
await Promise.all([Chat.create({
    members,
name:`${request.sender.name} - ${request.receiver.name}`,
}),
request.deleteOne(),
]);




emitEvent(req,REFETCH_CHATS,members);
return res.status(200).json({
    success: true,
    message: "Friend Request Accepted  ",
    senderId:request.sender._id,
    
});
    } catch (error) {
        next(error);
    }
}

 const getMyNotifications=async(req,res,next)=>{
    try {
        
        const requests=await Request.find({receiver:req.user}).populate("sender","name avatar");

        const  allRequests=requests.map(({_id,sender

        })=>({
            _id,
            sender:{
                _id:sender._id,
                name:sender.name,
                avatar:sender.avatar.url,
            },
        }));
        return res.status(200).json({//5:00
            success: true,
            allRequests ,
            
            
        });
    } catch (error) {
        next(error);
    }
}

const getMyFriends=async(req,res,next)=>{
    try {
        const chatId=req.query.chatId;
      const chats=await Chat.find({members:req.user,groupChat:false}).populate
      ("members","name avatar");
      const friends = chats.map(({ members }) => {
        const otherUser = getOtherMember(members, req.user);
        if (!otherUser) {
            // Log for debugging if no other user is found
            console.error("No other member found in chat:", members);
            
        }
        
        return {
            _id: otherUser._id,
            name: otherUser.name,
            avatar: otherUser.avatar.url,
        };
       
    }).filter(Boolean);
    if(chatId){
const chat =await Chat.findById(chatId);

const availableFriends=friends.filter(
    (friend)=>!chat.members.includes(friend._id)
);
return res.status(200).json({//5:00
    success: true,
    friends:availableFriends,
         
});
    }
    else{
        return res.status(200).json({//5:00
            success: true,
            friends ,
            
            
        });
    }
      
    } catch (error) {
        next(error);
    }
}

export {login,newUser,getMyProfile,logout,searchUser,
    sendFriendRequest,acceptFriendRequest,
    getMyNotifications,
    getMyFriends
};
import  jwt  from "jsonwebtoken";
import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import { User } from "../models/userModels.js";
import { ErrorHandler } from "../utils/utility.js";
import { cookieOptions } from "../utils/features.js";




const adminLogin = async (req, res, next) => {
    try {
        const { secretKey} = req.body;


const adminSecretKey=process.env.ADMIN_SECRET_KEY || "SSSINGH123";

        const isMatched=secretKey===adminSecretKey;
        // Check if both email and password are provided
        if (!isMatched) return next(new ErrorHandler("Invalid Admin Key",401));
              
 // Generate JWT
   
        const token=jwt.sign(secretKey,process.env.JWT_SECRET);

return res.status(200).cookie("chatterbox-admin-token",token,
    {...cookieOptions,maxAge:1000*60*10}
).json({
    status: "success",
    message: "Login successful Welcome",
    
    
});

} catch (error) {
next(error);
}
};

const adminLogout = async (req, res, next) => {
    console.log("Received request to logout..."); // First check
    try {
        console.log("Attempting to clear the admin token...");  // Log start of the logout function
        // Clear the admin authentication cookie
        return res.status(200).cookie("chatterbox-admin-token", "", {
            ...cookieOptions,
            
            maxAge: 0, // Set the expiration time to immediately clear the cookie
            
        }).json({
            status: "success",
            message: "Logout successful",
            
        });
    } catch (error) {
        console.error("Error in adminLogout function:", error); // Log any error
        next(error);
    }
};


const getAdminData = async (req, res, next) => {
   try {
       
     
        

        return res.status(200).json({
            admin:true,
        
        });
    } catch (error) {
        next(error);
    }
};




const allUsers=async(req,res,next)=>{
    try {
      const users=await User.find({});

const transformedUsers=await Promise.all(
   users.map( async({name,username,avatar,_id})=>{
        const [groups,friends] =await Promise.all([
            Chat.countDocuments({groupChat:true,members:_id}),
            Chat.countDocuments({groupChat:false,members:_id}),

        ]);
        return{
            name,username,
            avatar:avatar.url,
            _id,
            groups,
            friends,
        }
    }
))








        return res.status(200).json({
            status:"success",
            users:transformedUsers
        });



    } catch (error) {
        next(error);
    }
}


const allChats = async (req, res, next) => {
    try {
        // Fetch all chats from the database
        const chats = await Chat.find({})
            .populate("members", "name  avatar")
            .populate("creator", "name  avatar")
            

        const transformedChats = await Promise.all(
       chats.map(async({members,_id,groupChat,name,creator}) => {
          
const totalMessages=await Message.countDocuments({chat:_id});
            return {
                _id,
                groupChat,
                name,
                avatar:members.slice(0,3).map((member)=>member.avatar.url),
                members: members.map(({_id,name,avatar})=>({
            
                    _id,
                    name,
                    avatar: avatar.url,
                }
                )),

             creator:{
                name:creator?.name || "None",
                avatar:creator?.avatar.url || "None",
             },
             totalMembers:members.length,
             totalMessages,
            };
        })
    )
        return res.status(200).json({
            status: "success",
            chats: transformedChats,
        });

    } catch (error) {
        next(error);
    }
};

const allMessages = async (req, res, next) => {
    try {
        // Fetch all messages from the database
        const messages = await Message.find({})
            .populate("sender", "name avatar") // Populating sender with name and avatar
            .populate("chat", " groupChat"); // Populating chat with  and groupChat status

        // Transform the message data
        const transformedMessages = messages.map(({  content,attachment,_id,sender, createdAt,chat }) => ({
            _id,
            attachment,
            content,
            createdAt,
            //  chat,
            chat: chat ? chat._id : null,
            //  groupChat:chat.groupChat,
            groupChat: chat ? chat.groupChat : null, // Check if chat exists

            sender: {
                _id: sender._id,
                name: sender.name,
                avatar: sender.avatar ? sender.avatar.url : null, // Handle if avatar is null
            },
              

               
        }));
        
        return res.status(200).json({
            status: "success",
            messages: transformedMessages,
        });

    } catch (error) {
        next(error);
    }
};


const getDashboardStatus = async (req, res, next) => {
    try {
        // Fetch necessary counts for dashboard statistics
        const [usersCount, groupsCount, totalChatCount, messagesCount] = await Promise.all([
            User.countDocuments(), // Count all users
            Chat.countDocuments({ groupChat: true }), // Count all group chats
            Chat.countDocuments(), // Count all individual chats
            Message.countDocuments() // Count all messages
        ]);
const today=new Date();
const last7Days= new Date();
last7Days.setDate(last7Days.getDate()-7);

const last7DaysMessages=await Message.find({
    createdAt:{
        $gte:last7Days,
        $lte:today,
    },
}).select("createdAt");

const messages=new Array(7).fill(0);
const dayInMiliseconds=(1000*60*60*24)

last7DaysMessages.forEach(message=>{

    const indexApprox=(today.getTime()-message.createdAt.getTime()) /
    dayInMiliseconds;
    const index=Math.floor(indexApprox);
    messages[6-index]++;
});
        const stats={
            groupsCount,
            usersCount,
            messagesCount,
            totalChatCount,
            messagesChart:messages,
        };
        return res.status(200).json({
            status: "success",
           stats,
        });

    } catch (error) {
        next(error);
    }
};

export {allUsers,allChats,allMessages,getDashboardStatus,
    adminLogin,
    adminLogout,
    getAdminData

}
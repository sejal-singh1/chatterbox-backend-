import { ALERT, NEW_MESSAGE, NEW_MESSAGE_ALERT, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
import { Chat } from "../models/chat.js";
import { deletFilesFromCloudanary, emitEvent, uploadFilesToCloudinary } from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";
import {User} from "../models/userModels.js";
import {Message } from "../models/message.js";

//create new chat 
const newGroupChat=async(req,res,next)=>{
    try {
        

const {name,members}=req.body;


const allMembers=[...members,req.user];

await Chat.create({
    name,
    groupChat:true,
    creator:req.user,
members:allMembers,
});
emitEvent(req,ALERT,allMembers,`Welcome to ${name} group `);//alert message send all group member
emitEvent(req,REFETCH_CHATS,members);//onther user controll through the refetch chat
         return res.status(200).json({
            success:true,
            message:"Group chat created",
         })
    } catch (error) {
        next(error);
    }
}





//GET my chat
const getMyChats=async(req,res,next)=>{
    try {
        
const chats=await Chat.find({members:req.user}).populate(//populate used to get user document palce of id
    "members",
    "name  avatar" /// their are use to 

);

const transformedChats=chats.map(({_id,name,members,groupChat})=>{
    const otherMember=getOtherMember(members,req.user);
    

return {
    _id,
    groupChat,
    avatar:groupChat
    ?members.slice(0,3).map   // use this show the avatar for threee member
    // (({avatar})=>avatar.url):[otherMember.avatar.url],
    
    (member => member?.avatar?.url || null)
    : [otherMember?.avatar?.url || null],



   
    name:groupChat?name:otherMember?.name || "Unknown",
   
    members:members.reduce((prev,curr)=>{  // for GET  only member id BUT OUR ID
      if(curr._id.toString() !==req.user.toString()){
        prev.push(curr._id)
      }
      return prev;
    
},[]),
};
});
         return res.status(201).json({
            success:true,
           chats: transformedChats,
         })
    } catch (error) {
        next(error);
    }
}

//get my group
const getMyGroups=async(req,res,next)=>{
    try {
        const chats=await Chat.find({
            members:req.user,
            groupChat:true,
            creator:req.user

        }).populate("members","name avatar");

        const groups=chats.map(({members,_id,groupChat,name})=>({
_id,groupChat,name,
avatar:members.slice(0,3).map(({avatar})=>avatar?.url||null),
        }));
        return res.status(200).json({
            success:true,
            groups,
        })



    } catch (error) {
        next(error);
    }
}



// get my group
const addMembers = async (req, res, next) => {
    try {
        const { chatId, members } = req.body;

      
        const chat = await Chat.findById(chatId);
        if (!chat) return next(new ErrorHandler("Chat not found", 404));
        if (!chat.groupChat) return next(new ErrorHandler("This is not a group chat", 400));
        
        if (chat.creator.toString() !== req.user.toString()) 
            return next(new ErrorHandler("You are not allowed to add members", 403));
        
        const allNewMembersPromise = members.map((i) => User.findById(i, "name"));
        const allNewMembers = await Promise.all(allNewMembersPromise);

        // Filter out members already in the group
        // const uniqueMembers = allNewMembers
        //     .filter((i) => !chat.members.includes(i._id.toString()))
        //     .map((i) => i._id);


    // Find unique members
    const uniqueMembers = members.filter(
        (memberId) => !chat.members.includes(memberId)
    );




        // Add only unique members
        chat.members.push(...uniqueMembers);

        // Check for group members limit
        if (chat.members.length > 100)
            return next(new ErrorHandler("Group members limit reached", 400));
        
        await chat.save();

        // Notify new members added
        const allUsersName = uniqueMembers
            .map(id => allNewMembers.find(member => member._id.toString() === id.toString()).name)
            .join(", ");
        
        emitEvent(req, ALERT, chat.members, `${allUsersName} has been added to the group`);
        emitEvent(req, REFETCH_CHATS, chat.members);

        // Send response back to client
        return res.status(200).json({
            success: true,
            message: "Members added successfully",
        });
    } catch (error) {
        next(error);
    }
};


//remove member in the group
const  removeMember=async(req,res,next)=>{
    try {
       const {userId,chatId} =req.body;

       const [chat,userThatWillBeRemoved]=await Promise.all([
Chat.findById(chatId),
User.findById(userId,"name"),
       ]
       );
      

       if (!chat) return next(new ErrorHandler("Chat not found", 404));
       if (!chat.groupChat) return next(new ErrorHandler("This is not a group chat", 400));
       
       if (chat.creator.toString() !== req.user.toString()) 
           return next(new ErrorHandler("You are not allowed to add members", 403));
       
       if(chat.members.length <= 3) return next (new ErrorHandler("Group must have at least 3 members",400));





const allChatMembers=chat.members.map((i)=>i.toString());





chat.members=chat.members.filter((member)=>member.toString() !== userId.toString());

await chat.save();

emitEvent(
    req,
    ALERT,
    chat.members,
    {message:`${userThatWillBeRemoved.name} has been removed from the group`,chatId}
);









emitEvent(req,REFETCH_CHATS,allChatMembers);

return res.status(200).json({
    success:true,
    message:"Member removed successfully",
});
    } catch (error) {
        next(error);
    }
}
   

const leaveGroup = async (req, res, next) => {
    try {
        const chatId = req.params.id;
        const chat = await Chat.findById(chatId);
        if (!chat) return next(new ErrorHandler("Chat not found", 404));

        const remainingMembers = chat.members.filter(
            (member) => member.toString() !== req.user.toString()
        );

        if (remainingMembers.length < 3)
            return next(new ErrorHandler("Group must have at least 3 members", 400));

        // If the creator is leaving, assign a new random creator
        if (chat.creator.toString() === req.user.toString()) {
            const randomIndex = Math.floor(Math.random() * remainingMembers.length);
            const newCreator = remainingMembers[randomIndex];
            chat.creator = newCreator;
        }

        // Update the members list
        chat.members = remainingMembers;

        // Find the user leaving and save the chat
        const [user] = await Promise.all([User.findById(req.user, "name"), chat.save()]);

        emitEvent(
            req,
            ALERT,
            chat.members,{
           message: `User ${user.name} has left the group`,
    });

        return res.status(200).json({
            success: true,
            message: "Member removed successfully",
        });
    } catch (error) {
        next(error);
    }
};

const sendAttachments=async(req,res,next)=>{
    try {
        const {chatId}=req.body;
        const files=req.files || [];
        
        const [chat,me]=await Promise.all([
            Chat.findById(chatId),
            User.findById(req.user,"name")
        ]);
       
        if (!chat) return next(new ErrorHandler("Chat not found", 404));
       

        if (files.length < 1)
        return next(new ErrorHandler("Please Provide attachments", 400));
    //upload files here

    const attachments = await Promise.all(files.map(async (file) => {
        const result = await uploadFilesToCloudinary([file]);
        return {
            url: result[0].url,
            public_id: result[0].public_id,
        };
    }));




const messageForDB={content:"",
   attachment: attachments,sender:me._id,
   chat:chatId};
const messageForRealTime={//this is connect to sokent .to for id with show name
    ...messageForDB,
   
    sender:{
_id:me._id,
name:me.name,

},  
};
const message=await Message.create(messageForDB);

emitEvent(req,NEW_MESSAGE,chat.members,{
   message: messageForRealTime,
   chatId,
}
);
emitEvent(req,NEW_MESSAGE_ALERT,chat.members,{
    chatId
});

        return res.status(200).json({
            success: true,
            message,
        });
    } catch (error) {
        next(error);
    }
}
const  getChatDetails=async(req,res,next)=>{//chat milegi
    try {
        if(req.query.populate==="true"){
        
const chat=await Chat.findById(req.params.id)
.populate
("members","name avatar")
.lean();
if (!chat) return next(new ErrorHandler("Chat not found", 404));
chat.members=chat.members.map(({_id,name,avatar}) => ({
    _id,
    name,
    avatar:avatar.url,
}));
return res.status(200).json({
    success: true,
    chat,
});

        }else{
            
const chat=await Chat.findById(req.params.id);
if (!chat) return next(new ErrorHandler("Chat not found", 404));
return res.status(200).json({
    success: true,
    chat,
});

        }
    } catch (error) {
        next(error);
    }
}
const renameGroup=async(req,res,next)=>{
    try {
        const chatId=req.params.id;
        const {name} =req.body;

        const chat=await Chat.findById(chatId);
        if (!chat) {
            return next(new ErrorHandler("Chat not found", 404));
        }
    
        if (!chat.groupChat) {
            return next(new ErrorHandler("This is not a group chat", 400));
        }
if(chat.creator.toString()!==req.user.toString())
    return next(
new ErrorHandler("You are not allowed to rename the group",403))
        chat.name=name;
        await chat.save();
        emitEvent(req,REFETCH_CHATS,chat.members);
        res.status(200).json({
            success: true,
            message: "Group name updated successfully",
            chat,
        });



    } catch (error) {
        next(error);
    }
}
const deleteChat = async (req, res, next) => {//3:34
    try {
        const chatId = req.params.id;

        // Find the chat by ID
        const chat = await Chat.findById(chatId);

        // Check if chat exists
        if (!chat) {
            return next(new ErrorHandler("Chat not found", 404));
        }


        const members=chat.members;
        // Optional: Check if it's a group chat
        if (chat.groupChat && chat.creator.toString() !== req.user.toString()) {
            return next(new ErrorHandler("You are not allowed to delete this group chat", 403));
        }

        if(!chat.groupChat && !chat.members.includes(req.user.toString())){
            return next(
                new ErrorHandler("You are not allowed to delete this group chat", 403));
        }
            
        //here we have to all  message
        // Delete the chat

        const messagesWithAttachments=await Message.find({ 
            chat: chatId, 
            attachments: { $exists: true, $not: { $size: 0 } } 
        });
        


        const public_ids=[];


        messagesWithAttachments.forEach(({attachments})=>{
            attachments.forEach(({public_id})=>{
public_ids.push(public_id);
            })
        });
        await Promise.all([
//delete files from cloudanry
deletFilesFromCloudanary(public_ids),chat.deleteOne(),
chat.deleteOne(),
Message.deleteMany({chat:chatId}),

        ])
      

        // Optionally, emit an event to notify members of the deletion
        emitEvent(req, REFETCH_CHATS, members);

        // Send response back to the client
        res.status(200).json({
            success: true,
            message: "Chat deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

const getMessages = async (req, res, next) => {
    try {
        const chatId = req.params.id;
        const {page=1} =req.query;
          const resultPerPage =20;

         const skip=(page -1)*resultPerPage;

       const [messages,totalMessagesCount]=await Promise.all([
       Message.find({chat:chatId})
      .sort({createdAt:-1})
      .skip(skip)
     .limit(resultPerPage)
     .populate("sender","name")
     .lean(),
     Message.countDocuments({chat:chatId}),
]);

const totalPages=Math.ceil(totalMessagesCount/resultPerPage);

   
        // Send the messages as a response
        res.status(200).json({
            success: true,
            messages:messages.reverse(),
            totalPages,
        });
    } catch (error) {
        next(error);
    }
};

export {newGroupChat,
    getMyChats,
    getMyGroups,
    addMembers,
    removeMember,
    leaveGroup,
sendAttachments,
getChatDetails,
renameGroup,deleteChat,
getMessages}
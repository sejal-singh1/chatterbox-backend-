import express from "express";
import { isAuthenticated } from "../middleware/auth.js";
import { addMembers, deleteChat, getChatDetails, getMessages, getMyChats, getMyGroups, leaveGroup, newGroupChat, removeMember, renameGroup, sendAttachments } from "../controllers/chatController.js";
import { attachmentsMulter } from "../middleware/multer.js";
import { addMemberValidator, getChatDetailValidator, getMessagesValidator, leaveGroupValidator, newGroupValidator, removeMemberValidator, renameGroupValidator, sendAttachmentsValidator, validateHandler } from "../lib/validators.js";

const app=express.Router();



//after here user must be login to access route

app.use(isAuthenticated);
app.post("/new", newGroupValidator(), validateHandler,newGroupChat);

//get my chat 
app.get("/my",getMyChats);
//our group watch
app.get("/my/groups",getMyGroups);

app.put("/addmembers" ,addMemberValidator(),validateHandler,addMembers);

//remove the member
app.put("/removemember",removeMemberValidator(),validateHandler,removeMember);


//delete thought the id   leave the group'
app.delete("/ leave/:id",leaveGroupValidator(),validateHandler,leaveGroup);

//send attachment 
app.post("/message",attachmentsMulter, sendAttachmentsValidator(),validateHandler,sendAttachments);
app.get("/message/:id",getMessagesValidator(),validateHandler,getMessages);

app.route("/:id").get(getChatDetailValidator(),validateHandler,getChatDetails)
.put(renameGroupValidator(), validateHandler,renameGroup)
.delete(getChatDetailValidator(),validateHandler,deleteChat);//this is for use only one route and chaning difference


export default app;
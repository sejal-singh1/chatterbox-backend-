import express from  "express";
import { adminLogin, adminLogout, allChats, allMessages, allUsers,  getAdminData,  getDashboardStatus } from "../controllers/adminController.js";
import { adminLoginValidator, validateHandler } from "../lib/validators.js";
import { adminOnly } from "../middleware/auth.js";
const app=express.Router();

app.post("/verify",adminLoginValidator(),validateHandler,adminLogin);

app.get("/logout",adminLogout)


//only admin can access this route
app.use(adminOnly);

app.get("/",getAdminData);

app.get("/users",allUsers);


app.get("/chats",allChats);

app.get("/messages",allMessages);
app.get("/starts",getDashboardStatus);
export default app;
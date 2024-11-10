import express from "express";
import { acceptFriendRequest, getMyFriends, getMyNotifications, getMyProfile, login, logout, newUser, searchUser, sendFriendRequest } from "../controllers/userController.js";
import {  singleAvatar } from "../middleware/multer.js";
import { isAuthenticated } from "../middleware/auth.js";
import { acceptRequestValidator, loginValidator, registerValidator, sendFriendValidator, validateHandler } from "../lib/validators.js";
import { errorMiddleware } from "../middleware/error.js";

const app=express.Router();


app.post("/new" ,singleAvatar,registerValidator(),validateHandler, newUser);

app.post("/login" , loginValidator(),validateHandler, login);


//after here user must be login to access route

app.use(isAuthenticated);
app.get("/me" ,getMyProfile);
app.get("/logout",logout );
app.get("/search",searchUser );
app.put("/sendrequest", sendFriendValidator(),validateHandler,sendFriendRequest);
app.put("/acceptrequest", acceptRequestValidator(),validateHandler,acceptFriendRequest);
app.get("/notifications",getMyNotifications);
app.get("/friends",getMyFriends);
export default app;

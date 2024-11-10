import express from "express";

import { connectDB } from "./utils/features.js";

import dotenv from "dotenv"
import { errorMiddleware } from "./middleware/error.js";
import  cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { createServer } from "http";

import { NEW_MESSAGE, NEW_MESSAGE_ALERT, START_TYPING, STOP_TYPING } from "./constants/events.js";
import { v4 as uuid } from "uuid";
import cors from "cors"
import { getSockets } from "./lib/helper.js";
import { Message } from "./models/message.js";
import {v2 as cloudinary } from "cloudinary";
import { corsOptions } from "./constants/config.js";
import { socketAuthenticator } from "./middleware/auth.js";

import userRoutes from "./routes/userRoutes.js";
import chatRoutes from './routes/chatRoutes.js';
import adminRoute from "./routes/adminRoute.js"






dotenv.config({
    path:"./.env",
});

const MONGOURI=process.env.MONGO_URI;
const port=process.env.PORT||3000;
const envMode=process.env.NODE_ENV.trim() || "PRODUCTION";
const adminSecretKey=process.env.ADMIN_SECRET_KEY ||"sssingh123dfghjkjhgfdsa";
const userSocketIDs=new Map();//in this all conneting user


connectDB(MONGOURI);
cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})






const app=express();
//sockent Io setup
const server=createServer(app);
const io=new Server(server,{
    cors:corsOptions,
});
app.set("io",io);
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use("/api/v1/user",userRoutes);
app.use("/api/v1/chat",chatRoutes);
app.use("/api/v1/admin",adminRoute);

app.get("/",(req,res)=>{
    res.send("hello world");
});
io.use((socket,next)=>{
cookieParser()(socket.request,socket.request.res,async(err)=>{
  await  socketAuthenticator(err,socket,next)
});
 });

io.on("connection",(socket)=>{
    const user = socket.user;
    
    userSocketIDs.set(user._id.toString(),socket.id);


    socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
        try {
            const messageForRealTime = {
                content: message,
                _id: uuid(),
                sender: {
                    _id: user._id,
                    name: user.name,
                },
                chat: chatId,
                createdAt: new Date().toISOString(),
            };

            const messageForDB={
                content: message,
                sender:user._id,
                chat:chatId,
            };
            

            const membersSocket=getSockets(members);
io.to(membersSocket).emit(NEW_MESSAGE,{
    chatId,
    message:messageForRealTime,
});
io.to(membersSocket).emit(NEW_MESSAGE_ALERT,{
    chatId
});

         try {
            await Message.create(messageForDB);
         } catch (error) {
            console.log(error);
         }
    
            
    
        } catch (error) {
            console.error("Error in NEW_MESSAGE event:", error);
            
            socket.emit("error", { message: "Something went wrong while processing the message." });
        }
    });
    
socket.on(START_TYPING,({members,chatId})=>{
const membersSocket=getSockets((members));

socket.to(membersSocket).emit(START_TYPING,(chatId));
});

socket.on(STOP_TYPING,({members,chatId})=>{
    const membersSocket=getSockets((members));
    
    socket.to(membersSocket).emit(STOP_TYPING,(chatId));
    });
    


socket.on("disconnect",()=>{
    console.log("user disconnection");
    userSocketIDs.delete(user._id.toString());
})
});










app.use(errorMiddleware);











server.listen(port,()=>{
    console.log(`server is running on port ${port} in ${envMode} Mode`);
});
export {
    envMode,adminSecretKey,userSocketIDs
};
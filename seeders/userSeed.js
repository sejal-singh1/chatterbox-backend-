import { group } from 'console';
import { Chat } from '../models/chat.js';
import {User } from '../models/userModels.js'
import {faker, simpleFaker} from '@faker-js/faker'
import { Message } from '../models/message.js';
//use to this crete fake data for user\
const createUser=async(numUsers)=>{
try {
    const userPromise=[];
    for(let i=0;i<numUsers;i++){
        const tempUser=User.create({
            name:faker.person.fullName(),
            username:faker.internet.username(),
            bio:faker.lorem.sentence(10),
            password:"password",
            avatar:{
                url:faker.image.avatar(),
                public_id:faker.system.fileName()
            }
        });
        userPromise.push(tempUser);
    }
    await Promise.all(userPromise);
    console.log("users created",numUsers);
    process.exit(1);
} catch (error) {
    console.log(error);
    process.exit(1);
}
};
const createSingleChats=async(numChats)=>{
    try {
        const users = await User.find().select("_id");
        const chatPromise = [];

        for (let i = 0; i < users.length; i++) {
            for (let j = i+1; j < users.length; j++) {
        
            chatPromise.push(
                Chat.create({
                    name:faker.lorem.words(2),
                    members:[users[i],users][j],
                })
            );
        }
    }
        await Promise.all(chatPromise);
        console.log("Single chats created:");
        process.exit();
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

const createGroupChats=async(numChats)=>{
    try {
        const users = await User.find().select("_id");
        const chatPromise = [];

        for (let i = 0; i < numChats; i++) {
            // Randomly select 3 to 5 users for a group chat
            const numMembers = simpleFaker.number.int({ min: 3, max: users.length });
            const members = [];

            // Change here: Declare randomIndex outside the loop
            for (let j = 0; j < numMembers; j++) {
                const randomIndex = Math.floor(Math.random() * users.length);
                const randomUser = users[randomIndex];
                
                if (!members.includes(randomUser)) {
                    members.push(randomUser);
                }
            }
            const chat = await Chat.create({
                groupChat: true,
                name: faker.lorem.words(1),
                members,
                creator: members[0],
            });

            chatPromise.push(chat); // Add to promise array
        }

        await Promise.all(chatPromise);
        console.log("Group chats created:");
        process.exit();
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
    
};

// Function to create messages
const createMessages = async (numMessages) => {
    try {
        const chats = await Chat.find().populate("members"); // Fetch chats and populate members
const messagePromises = [];

for (let i = 0; i < numMessages; i++) {
    // Randomly select a chat to add the message to
    const chat = faker.helpers.arrayElement(chats);

const sender = faker.helpers.arrayElement(chat.members);

// Create a message with fake content
const tempMessage = Message.create({
    chat: chat._id,

sender: sender._id,
content: faker.lorem.sentence(),
createdAt: faker.date.recent(), // Set a recent date
});

messagePromises.push(tempMessage);
}
await Promise.all(messagePromises);
console.log("Messages created:", numMessages);
process.exit(1);
} catch (error) {
console.log(error);
process.exit(1);
}
};

const createMessagesInAChat = async (chatId, numMessages) => {
    try {
        // Fetch the specific chat and populate its members
        const chat = await Chat.findById(chatId).populate("members");
        
        if (!chat) {
            console.log("Chat not found");
            process.exit(1);
        }

        const messagePromises = [];

        for (let i = 0; i < numMessages; i++) {
            // Randomly select a sender from the chat members
            const sender = faker.helpers.arrayElement(chat.members);

            // Create a message with fake content
            const tempMessage = Message.create({
                chat: chat._id,
                sender: sender._id,
                content: faker.lorem.sentence(),
                createdAt: faker.date.recent(), // Set a recent date for realism
            });
            messagePromises.push(tempMessage);
        }

        await Promise.all(messagePromises);
        console.log(`Created ${numMessages} messages in chat with ID: ${chatId}`);
        process.exit(1);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

     
export {createUser,createSingleChats,createGroupChats,createMessages,createMessagesInAChat}
import { body, validationResult ,check, param, query} from "express-validator";
import { ErrorHandler } from "../utils/utility.js";

// Validation rules for registration
const registerValidator = () => [
    body("name").notEmpty().withMessage("Please Enter Name"),
    body("username").notEmpty().withMessage("Please Enter Username"),
    body("bio").notEmpty().withMessage("Please Enter Bio"),
    body("password").notEmpty().withMessage("Please Enter Password"),
];
const loginValidator = () => [
    
    body("username").notEmpty().withMessage("Please Enter Username"),
    body("password").notEmpty().withMessage("Please Enter Password"),
];

const newGroupValidator = () => [
    
    body("name").notEmpty().withMessage("Please Enter name"),
    body("members").notEmpty().withMessage("Please Enter Members").isArray({min:2,max:100}).withMessage("Members must be 2-100"),
];

const addMemberValidator = () => [
    
    body("chatId").notEmpty().withMessage("Please Enter Chat ID"),
    body("members").notEmpty().withMessage("Please Enter Members").isArray({min:1,max:97}).withMessage("Members must be 1-97"),
];

const removeMemberValidator = () => [
    
    body("chatId").notEmpty().withMessage("Please Enter Chat ID"),
    body("userId").notEmpty().withMessage("Please Enter User ID"),
   
];
const leaveGroupValidator = () => [
    
    param("id").notEmpty().withMessage("Please Enter Chat ID")
   
];
const sendAttachmentsValidator = () => [
    
    body("chatId").notEmpty().withMessage("Please Enter Chat ID"),
   
];
const getMessagesValidator = () => [
    
    param("id").notEmpty().withMessage("Please Enter Chat ID"),
    
   
];
const getChatDetailValidator = () => [
    
    param("id").notEmpty().withMessage("Please Enter Chat ID"),
    
   
];
const renameGroupValidator = () => [
    
    param("id").notEmpty().withMessage("Please Enter Chat ID"),
    body("name").notEmpty().withMessage("Please Enter New Name"),
   
];
const sendFriendValidator = () => [
    
   
    body("userId").notEmpty().withMessage("Please Enter UserID"),
   
];
const acceptRequestValidator = () => [
    
   
    body("requestId").notEmpty().withMessage("Please Enter Request ID"),
    body("accept").notEmpty().withMessage("Please Add Accept").isBoolean().withMessage("Accept must be a boolean"),
   
];

const adminLoginValidator = () => [
    
   
    body("secretKey").notEmpty().withMessage("Please Enter Secret Key"),
    
   
];








// Error handling middleware for validation
const validateHandler = (req, res, next) => {//4:48
    const errors = validationResult(req);
    const errorMessages=errors.array().map((error)=>error.msg).join(", ");

    if(errors.isEmpty()) {return  next(); 
    }
    else{

    next(new ErrorHandler(errorMessages,400));
    }
};

export { registerValidator, validateHandler,loginValidator ,newGroupValidator,addMemberValidator,removeMemberValidator,
    leaveGroupValidator,
    sendAttachmentsValidator,
    getMessagesValidator,
    getChatDetailValidator,
    renameGroupValidator,
    sendFriendValidator,
    acceptRequestValidator,
    adminLoginValidator
};

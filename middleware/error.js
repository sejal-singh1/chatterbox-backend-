import { ErrorHandler } from "../utils/utility.js";

const errorMiddleware=(err,req,res,next)=>{
err.message=err.message||"Internal Server Error";
 err.statusCode=err.statusCode||500;


 if (err.code === 11000) {
    const field = Object.keys(err.keyPattern).join(", ");
    err.message = `Duplicate field: ${field}`;
    err.statusCode = 400;
}

if (err.name === "CastError") {
    
    err.message = `Invalid Format of ${err.Path}`;
    err.statusCode = 400;
}

    // Handle the ErrorHandler custom error
    // Validation Errors (Express-validator)
    if (err.errors && Array.isArray(err.errors)) {
        err.message = err.errors.map((e) => e.msg).join(", ");
        err.statusCode = 400;
    }

    // Custom Error Handler
    if (err instanceof ErrorHandler) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }




    console.error("Error Details:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code,
    });






return res.status(err.statusCode).json({
    success:false,
    message:err.message,
});
};



export {errorMiddleware };
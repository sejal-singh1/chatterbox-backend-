class ErrorHandler extends Error{
    constructor(message,statusCode){
        super(message || "Internal Server Error");
        this.statusCode = statusCode || 500;

    }
}
export {ErrorHandler};
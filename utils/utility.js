class ErrorHandler extends Error{
    constructor(message,statusCode){
        super(message),  //super means Error ko  msg get ho gya
        this.statusCode=statusCode;
    }
}
export {ErrorHandler};
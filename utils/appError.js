class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    //for operational errors
    this.isOperational = true;

    // this captures the stack trace for the obj
    // and doesn't add the class constuctor call to the stack
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

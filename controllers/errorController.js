const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value! ${value}`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((e) => e.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('invalid token', 401);
const handleJWTExpiredError = () => new AppError('token expired', 401);

const sendErrorDev = (err, req, res) => {
  //api
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  //rendered website
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Error!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // api
  if (req.originalUrl.startsWith('/api')) {
    // operational, trusted error, send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    //programming error
    // send generic response & don't leak details to client for unknown errors
    console.error('ERROR!!!', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong! :(',
    });
  }
  // rendered website & trusted error
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Error!',
      msg: err.message,
    });
  }

  //programming or unknown error
  console.error('ERROR!!!', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'Please try again later',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.assign(err);
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

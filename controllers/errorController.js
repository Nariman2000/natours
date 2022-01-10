const chalk = require('chalk');

/* eslint-disable node/no-unsupported-features/es-syntax */
const { AppError } = require('../utils/appError');

// ID ERRORS
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// DUPLICATE KEY ERROR 11000
const handleDuplicateKeyDB = (err) => {
  const message = `Tour name: (${err.keyValue.name}) has already exist! please try another name`;
  return new AppError(message, 400);
};

// VALIDATION ERROR
const handleValidationDB = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// JWT TOKEN MANIPULATE ERROR
const handleJsonWebTokenError = () =>
  new AppError('Invalid Token please log-in again', 401);

// JWT TOKEN EXPIRED ERROR
const handleJWTexpiredError = () =>
  new AppError('Token was expired please log-in', 401);

const sendErrorDev = (err, req, res) => {
  // API
  console.log(chalk.yellow(err.stack));
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
    });
  }

  // A: USER VIEWS RENDER PAGE
  console.log('Error 🔥', err);
  res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    message: err.message,
  });
};

const sendErrorProduction = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    // Operational and trusted errors : send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // Programming or other unknown error : don't want to send to client
    // 1- Log error
    console.log('Error 🔥', err);

    // 2- Send generic message (we not create this errors by self)
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  // B: USER VIEWS RENDER PAGE
  // Operational and trusted errors : send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      message: err.message,
    });
  }

  // Programming or other unknown error : don't want to send to client
  // 1- Log error
  console.log('Error 🔥', err);

  // 2- Send generic message (we not create this errors by self)
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    message: 'Please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  err.status = err.status || 'Error';
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (err.name === 'CastError') {
      error = handleCastErrorDB(error);
    }

    if (err.code === 11000) {
      error = handleDuplicateKeyDB(error);
    }

    if (err.name === 'ValidationError') {
      error = handleValidationDB(error);
    }

    if (err.name === 'JsonWebTokenError') {
      error = handleJsonWebTokenError();
    }

    if (err.name === 'TokenExpiredError') {
      error = handleJWTexpiredError();
    }
    console.log(err);
    console.log(error);
    sendErrorProduction(error, req, res);
  }
};

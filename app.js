const path = require('path');

const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

// UTILS
const { AppError } = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const setHeaderErr = require('./utils/setHeaderError');

// START EXPRESS APP
const app = express();

// TEMPLATE ENGINE
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1- GLOBAL MIDDLEWARES
// STATIC_FILES
app.use(express.static(path.join(__dirname, 'public')));

// Security HTTP Headers
app.use(helmet());
app.use(setHeaderErr);

// ENVIROMENT
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit Request
const limiter = rateLimit({
  // !00 req from same IP in hour
  max: 100,
  window: 60 * 60 * 1000,
  message: 'Too many request from yhis IP,please try again in hour',
});

app.use('/api', limiter);

// BODY_PARSER
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// TEST MIDDLEWARES
app.use((req, res, next) => {
  console.log(req.method, req.hostname);
  req.requestTime = new Date().toLocaleTimeString('IR');
  console.log(req.requestTime);

  // console.log(req.headers);
  // console.log(req.cookies);  // console.log(req.cookies);
  next();
});

// Data Sanitization against NO_SQL query injection (remove $ like: $gt)
app.use(mongoSanitize());

// Data sanitization against XSS attacks (remove HTML codes)
app.use(xss());

// HTTTP Parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// ROUTES
const viewRouter = require('./routes/view');
const tourRouter = require('./routes/tours');
const userRouter = require('./routes/users');
const reviewRouter = require('./routes/review');

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// ERROR HANDLER 404
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'Failed',
  //   message: `can't find ${req.originalUrl} on this server!`,
  // });

  // const err = new Error(`can't find ${req.originalUrl} on this server!`);
  // err.status = 'Fail';
  // err.statusCode = 404;

  // Any thing pass into next() assume as a ERROR
  next(new AppError(`can't find ${req.originalUrl} on this server!`, 404));
});

// ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;

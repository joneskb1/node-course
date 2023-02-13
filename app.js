const path = require('path');
const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const helmet = require('helmet');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const bookingController = require('./controllers/bookingController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.enable('trust proxy');

//// GLOBAL Middleware

app.use(cors());

app.options('*', cors());

// serving static files
app.use(express.static(path.join(__dirname, 'public')));

//security http headers
app.use(helmet());

// dev logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// limit req from same IP
const limiter = rateLimit({
  // allow 100 req from same IP for 1 hour (in ms)
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'too many requests from this IP, wait 1 hr',
});

app.use('/api', limiter);

// need body raw not in json
// for prod
// app.post(
//   '/webhook-checkout',
//   express.raw({ type: 'application/json' }),
//   bookingController.webhookCheckout
// );

// body parser, reading data from body into req.body
// parse cookies
app.use(
  express.json({
    limit: '10kb',
  })
);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//clean body data, data sanitization against NoSQL query injection
// filters out $ and . so queries won't work
app.use(mongoSanitize());

//data sanitization against XSS
// converts html symbols into entities
app.use(xss());

// prevents parameter pollution (cleans up query)
app.use(
  hpp({
    // don't allow sort since it would try to split an array instead of a string
    // allow for duplicate queries
    whiteList: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression());

// test middleware
// app.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   next();
// });

///// mounting routes
app.use('/', viewRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// runs for all http methods for all non specified routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

//global error handling middleware
// by using 4 params express knows its an error function
app.use(globalErrorHandler);

module.exports = app;

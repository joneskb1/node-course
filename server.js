// to start "npm run start"

const dotenv = require('dotenv');
const mongoose = require('mongoose');

// handle sync errors
process.on('uncaughtException', (err) => {
  console.log('uncaught exception, shutting down!');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB up');
  });

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log('server up');
});

// handle async errors outside express
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('unhandled rejection, shutting down!');
  // handle req then shut down
  server.close(() => {
    // 0 = success 1 = uncaught excpetion
    process.exit(1);
  });
});

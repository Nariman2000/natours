// ENVIROMENT_VARIABLES
const mongoose = require('mongoose');
const dotEnv = require('dotenv');
const chalk = require('chalk');

// Handling uncaught errors
process.on('uncaughtException', (err) => {
  console.log(chalk.yellow('UNCAUGHT EXCEPTION! 🔥 SHUTTING DOWN ...'));
  console.log(err.name, err.message);

  process.exit(1);
});

dotEnv.config({ path: './config.env' });

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
    console.log(chalk.green('DB Connected Successfully.'));
  })
  .catch((err) => {
    console.log('DB ERROR', err);
  });

// SERVER
const app = require('./app');

// console.log(process.env);

const PORT = process.env.PORT || 3003;

const server = app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});

// Any Promise rejection handled with this add event listener
process.on('unhandledRejection', (err) => {
  console.log(chalk.yellow('UNHANDLER REJECTION! 🔥 SHUTTING DOWN ...'));
  console.log(err.name, err.message);

  // Close the Server
  server.close(() => {
    // Shutdown application
    process.exit(1);
  });
});

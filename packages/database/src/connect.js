/* eslint-disable global-require, no-console */
import mongoose from 'mongoose';
import debug from 'debug';

import logger from './logger';

const log = debug('kammyui:models');
let connection;

const connect = (uri, options) => {
  log(uri);
  mongoose.Promise = global.Promise;
  mongoose.set('debug', logger);
  connection = mongoose.connect(uri, options);
  mongoose.connection.on('error', (err) => {
    log(`Mongoose connection error: ${err}`);
    process.exit(1);
  });

  mongoose.connection.on('connected', () => {
    log(`Mongoose default connection open to ${uri}`);
  });
  mongoose.connection.on('disconnected', () => {
    log('Mongoose default connection disconnected');
  });

  // If the Node process ends, close the Mongoose connection
  process.on('SIGINT', () => {
    mongoose.connection.close(() => {
      log('Mongoose default connection disconnected through app termination');
      process.exit(0);
    });
  });
};

export default async (uri) => {
  if (!connection && uri) {
    connection = connect(uri);
    require('./models/player.schema');
    require('./models/cup.schema');
  }

  // load models
  const player = require('./models/player');
  const cup = require('./models/cup');
  return {
    ...player,
    ...cup,
  };
};

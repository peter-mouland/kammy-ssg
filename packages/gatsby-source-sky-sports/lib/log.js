/* eslint-disable no-console */
const chalk = require('chalk');

const branding = chalk.bgBlue.whiteBright(' DraftFF ');
const errorBranding = chalk.bgRed.whiteBright(' DraftFF ');

const logger = {
    branding,
    title: function log(message) {
        return console.log(`\n${branding} ${chalk.bold(message)}`);
    },
    info: function log(message) {
        return console.log(`${branding} ${message}`);
    },
    error: function error(message) {
        return console.error(`\n${errorBranding} ${chalk.red(message)}\n`);
    },
    warn: function error(message) {
        return console.warn(`${errorBranding} ${chalk.yellow(message)}`);
    },
    timed: function timed(message, type = 'title') {
        const start = new Date();
        logger[type](message);
        return () => {
            logger.info(`/${message} (${((new Date() - start) / 1000).toFixed(2)}s)`);
        };
    },
};

module.exports = logger;

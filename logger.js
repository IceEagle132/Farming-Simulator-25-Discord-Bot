const { createLogger, format, transports } = require('winston');
const config = require('./config.json');

const logger = createLogger({
    level: config.debug ? 'debug' : 'info',  // Control logging level from config
    format: format.combine(
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level}: ${message}`;
        })
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/bot.log' })
    ]
});

module.exports = logger;
var winston = require('winston');
var config = require('config');
var fs = require('fs');
var ENV = process.env.NODE_ENV;

var logsFolderPath = __dirname + '/..' + config.get('logsFolderName');
try {
  fs.mkdirSync(logsFolderPath);
} catch (e) {}

function getLogger(module) {
  var path = module.filename.split('/').slice(-2).join('-');

  // Define levels to be like log4j in java
  var customLevels = {
    levels: {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    },
    colors: {
      debug: 'blue',
      info: 'green',
      warn: 'yellow',
      error: 'red'
    }
  };

  return new winston.Logger({
    levels: customLevels.levels,
    transports: [
      new winston.transports.Console({
        colorize: true,
        level: ENV == 'development' ? 'debug' : 'error',
        label: path,
        levels: customLevels.levels
      }),
      new winston.transports.File({
        colorize: true,
        level: 'debug',
        timestamp: true,
        filename: config.get('logs_folder_path') + '/log_[' + path + '].log',
        maxsize: 1024 * 1024 * 10, // 10MB
        levels: customLevels.levels
      })
    ]
  });
}

module.exports = getLogger;
var config = require('config');

var PHOTO_FOLDER = __dirname + config.get('uploadsFolderName');
var LOGS_FOLDER = __dirname + config.get('logsFolderName');
config.set('photo_folder_path', PHOTO_FOLDER);
config.set('logs_folder_path', LOGS_FOLDER);

var mongoose = require('libs/mongoose');
var log = require('libs/log')(module);
var ClientModel = require('models/client');
var AccessTokenModel = require('models/accessToken');
var RefreshTokenModel = require('models/refreshToken');
var fs = require('fs');

var uploadsFolderPath = __dirname + config.get('uploadsFolderName');
try {
  fs.mkdirSync(uploadsFolderPath);
  log.info('Folders ' + config.get('uploadsFolderName') + ' created');
} catch (e) {
  log.info('Folders ' + config.get('uploadsFolderName') + ' exist');
}

var logsFolderPath = __dirname + config.get('logsFolderName');
try {
  fs.mkdirSync(logsFolderPath);
  log.info('Folders ' + config.get('logsFolderName') + ' created');
} catch (e) {
  log.info('Folders ' + config.get('logsFolderName') + ' exist');
}

ClientModel.remove({}, function (err) {
  var client = new ClientModel({ name: config.get('webClient:name'), clientId: config.get('webClient:clientId'), clientSecret: config.get('webClient:clientSecret') });
  client.save(function (err, client) {
    if (err) return log.error(err);
    else log.info("New client - %s:%s", client.clientId, client.clientSecret);
  });
});

AccessTokenModel.remove({}, function (err) {
  if (err) return log.error(err);
});

RefreshTokenModel.remove({}, function (err) {
  if (err) return log.error(err);
});

setTimeout(function () {
  mongoose.disconnect();
}, 3000);
var config = require('config');
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var UserModel = require('models/user');
var ClientModel = require('models/client');
var AccessTokenModel = require('models/accessToken');
var RefreshTokenModel = require('models/refreshToken');

passport.use(new BasicStrategy(
  function (usernick, password, callback) {
    ClientModel.findOne({ clientId: usernick }, function (err, client) {
      if (err) {
        return callback(err);
      }
      if (!client) {
        return callback(null, false);
      }
      if (client.clientSecret != password) {
        return callback(null, false);
      }

      return callback(null, client);
    });
  }
));

passport.use(new ClientPasswordStrategy(
  function (clientId, clientSecret, callback) {
    ClientModel.findOne({ clientId: clientId }, function (err, client) {
      if (err) {
        return callback(err);
      }
      if (!client) {
        return callback(null, false);
      }
      if (client.clientSecret != clientSecret) {
        return callback(null, false);
      }

      return callback(null, client);
    });
  }
));

passport.use(new BearerStrategy(
  function (accessToken, callback) {
    AccessTokenModel.findOne({ token: accessToken }, function (err, token) {
      if (err) {
        return callback(err);
      }
      if (!token) {
        return callback(null, false);
      }

      if (Math.round((Date.now() - token.created) / 1000) > config.get('security:tokenLife')) {
        AccessTokenModel.remove({ token: accessToken }, function (err) {
          if (err) return callback(err);
        });
        return callback(null, false, { message: 'Token expired' });
      }

      UserModel.findById(token.userId, function (err, user) {
        if (err) {
          return callback(err);
        }
        if (!user) {
          return callback(null, false, { message: 'Unknown user' });
        }

        var info = { scope: '*' }
        callback(null, user, info);
      });
    });
  }
));
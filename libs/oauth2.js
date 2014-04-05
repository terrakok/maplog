var oauth2orize = require('oauth2orize');
var passport = require('passport');
var crypto = require('crypto');
var config = require('config');
var UserModel = require('models/user');
var ClientModel = require('models/client');
var AccessTokenModel = require('models/accessToken');
var RefreshTokenModel = require('models/refreshToken');
var log = require('libs/log')(module);

// create OAuth 2.0 server
var server = oauth2orize.createServer();

// Exchange username & password for access token.
server.exchange(oauth2orize.exchange.password(function (client, username, password, scope, done) {
  log.debug('Call exchange password method Client = ' + client + ', user = ' + username);
  UserModel.findOne({ userNick: username }, function (err, user) {
    if (err) {
      log.debug('UserModel.findOne ERROR = ' + err);
      return done(err);
    }
    if (!user) {
      log.debug('UserModel.findOne user = null');
      return done(null, false);
    }
    if (!user.checkPassword(password)) {
      log.debug('UserModel.findOne password incorrect');
      return done(null, false);
    }

    RefreshTokenModel.remove({ userId: user.userId, clientId: client.clientId }, function (err) {
      if (err) {
        log.debug('RefreshTokenModel.remove ERROR = ' + err);
        return done(err);
      }
    });
    AccessTokenModel.remove({ userId: user.userId, clientId: client.clientId }, function (err) {
      if (err) {
        log.debug('AccessTokenModel.remove ERROR = ' + err);
        return done(err);
      }
    });

    var tokenValue = crypto.randomBytes(32).toString('base64');
    var refreshTokenValue = crypto.randomBytes(32).toString('base64');
    var token = new AccessTokenModel({ token: tokenValue, clientId: client.clientId, userId: user.userId });
    var refreshToken = new RefreshTokenModel({ token: refreshTokenValue, clientId: client.clientId, userId: user.userId });
    refreshToken.save(function (err) {
      if (err) {
        log.debug('refreshToken.save ERROR = ' + err);
        return done(err);
      }
    });
    token.save(function (err, token) {
      if (err) {
        log.debug('token.save ERROR = ' + err);
        return done(err);
      }
      log.debug('token.save DONE token = ' + tokenValue + ', refreshTokenValue = ' + refreshTokenValue);
      done(null, tokenValue, refreshTokenValue, { 'expires_in': config.get('security:tokenLife') });
    });
  });
}));

// Exchange refreshToken for access token.
server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshToken, scope, done) {
  log.debug('Call exchange refreshToken method Client = ' + client + ', refreshToken = ' + refreshToken);
  RefreshTokenModel.findOne({ token: refreshToken }, function (err, token) {
    if (err) {
      return done(err);
    }
    if (!token) {
      return done(null, false);
    }
    if (!token) {
      return done(null, false);
    }

    UserModel.findById(token.userId, function (err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false);
      }

      RefreshTokenModel.remove({ userId: user.userId, clientId: client.clientId }, function (err) {
        if (err) return done(err);
      });
      AccessTokenModel.remove({ userId: user.userId, clientId: client.clientId }, function (err) {
        if (err) return done(err);
      });

      var tokenValue = crypto.randomBytes(32).toString('base64');
      var refreshTokenValue = crypto.randomBytes(32).toString('base64');
      var token = new AccessTokenModel({ token: tokenValue, clientId: client.clientId, userId: user.userId });
      var refreshToken = new RefreshTokenModel({ token: refreshTokenValue, clientId: client.clientId, userId: user.userId });
      refreshToken.save(function (err) {
        if (err) {
          return done(err);
        }
      });
      var info = { scope: '*' }
      token.save(function (err, token) {
        if (err) {
          return done(err);
        }
        log.debug('token.save DONE token = ' + tokenValue + ', refreshTokenValue = ' + refreshTokenValue);
        done(null, tokenValue, refreshTokenValue, { 'expires_in': config.get('security:tokenLife') });
      });
    });
  });
}));


// token endpoint
exports.token = [
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  server.token(),
  server.errorHandler()
]
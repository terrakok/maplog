var config = require('config');

var PHOTO_FOLDER = __dirname + config.get('uploadsFolderName');
var LOGS_FOLDER = __dirname + config.get('logsFolderName');
config.set('photo_folder_path', PHOTO_FOLDER);
config.set('logs_folder_path', LOGS_FOLDER);

var express = require('express');
var http = require('http');
var log = require('libs/log')(module);
var passport = require('passport');
var oauth2 = require('libs/oauth2');
var routes = require('routes');
require('libs/auth');

var app = express();

//CORS middleware
var allowCrossDomain = function (req, res, next) {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  next();
}
app.use(allowCrossDomain); // для кроссдоменного доступа

app.use(express.static(__dirname + '/public'));

app.use(express.favicon()); // отдаем стандартную фавиконку, можем здесь же свою задать

if (app.get('env') == 'development') {
  app.use(express.logger('dev')); // выводим все запросы со статусами в консоль
} else {
  app.use(express.logger('default'));
}

app.use(passport.initialize());

app.use(express.bodyParser()); // стандартный модуль, для парсинга JSON в запросах

app.use(app.router); // модуль для простого задания обработчиков путей

app.use(function (req, res, next) {
  res.status(404);
  log.debug('Not found URL: %s', req.url);
  res.send({ error: 'Not found' });
  return;
});

app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  log.error('Internal error(%d): %s', res.statusCode, err.message);
  res.send({ error: err.message });
  return;
});

app.get('/api', function (req, res) {
  res.send('API is running');
});

app.post('/api/token', oauth2.token);

app.post('/api/registration', function (req, res) {
    routes.registration(req.body.usernick, req.body.useremail, req.body.password, function (err, user) {
      if (err) {
        log.info('registration fail: ' + err.message);
        res.status(200);
        res.send({
          error: err.message
        });
      } else {
        log.info('registration done ' + user.userNick);
        res.status(200);
        res.send({
          message: 'Registration completed!',
          usernick: user.userNick
        });
      }
    });
  }
);

app.post('/api/save_track',
  passport.authenticate('bearer', { session: false }),
  function (req, res) {
    routes.saveTrack(req.user.userNick, req.body, function (err, trackID) {
      if (err) {
        log.info('saveTrack fail: ' + err.message);
        res.status(200);
        res.send({
          error: err.message
        });
      } else {
        log.info('saveTrack done ' + trackID);
        res.status(200);
        res.send(trackID);
      }
    });
  }
);

app.post('/api/delete_track',
  passport.authenticate('bearer', { session: false }),
  function (req, res) {
    routes.deleteTrack(req.user.userNick, req.body.trackID, function (err) {
      if (err) {
        log.info('deleteTrack fail: ' + err.message);
        res.status(200);
        res.send({
          error: err.message
        });
      } else {
        log.info('deleteTrack done ' + req.body.trackID);
        res.status(200);
        res.send({message: 'done!'});
      }
    });
  }
);

app.post('/api/delete_photo',
  passport.authenticate('bearer', { session: false }),
  function (req, res) {
    routes.removePhoto(req.body.photoID, function (err) {
      if (err) {
        log.info('removePhoto fail: ' + err.message);
        res.status(200);
        res.send({
          error: err.message
        });
      } else {
        log.info('removePhoto done ' + req.body.photoID);
        res.status(200);
        res.send({message: 'done!'});
      }
    });
  }
);

app.post('/api/upload_new_photo',
  passport.authenticate('bearer', { session: false }),
  function (req, res) {
    routes.uploadNewFile(req.files.newPhoto, function (err, fileID) {
      if (err) {
        log.info('upload_new_photo fail: ' + err.message);
        res.status(200);
        res.send({
          error: err.message
        });
      } else {
        log.info('upload_new_photo done fileID = ' + fileID);
        res.status(200);
        res.send({fileID: fileID});
      }
    });
  }
);

app.get('/api/photo/:id',
  function (req, res) {
    var photoID = req.params.id;
    routes.getPhoto(photoID, function (err, file) {
      if (err) {
        log.info('photo fail: ' + err.message);
        res.status(200);
        res.send({
          error: 'error not found'
        });
      } else {
        log.info('photo done fileID = ' + photoID);
        res.writeHead(200, {'Content-Type': 'image/jpeg'});
        res.end(file, 'binary');
      }
    });
  }
);

app.post('/api/get_tracks',
  function (req, res) {
    routes.getUserTracks(req.body.userNick, function (err, tracks) {
      if (err) {
        log.info('get_tracks fail: ' + err.message);
        res.status(200);
        res.send({
          error: err.message
        });
      } else {
        log.info('get_tracks done tracks = ' + tracks.length);
        res.status(200);
        res.send(tracks);
      }
    });
  }
);

app.post('/api/get_user_info',
  function (req, res) {
    routes.getUserInfo(req.body.userNick, function (err, user) {
      if (err) {
        log.info('get_user_info fail: ' + err.message);
        res.status(200);
        res.send({
          error: err.message
        });
      } else {
        log.info('get_user_info done user = ' + user);
        res.status(200);
        res.send(user);
      }
    });
  }
);

app.get('/api/get_my_info',
  passport.authenticate('bearer', { session: false }),
  function (req, res) {
    routes.getFullUserInfo(req.user.userNick, function (err, user) {
      if (err) {
        log.info('get_user_info fail: ' + err.message);
        res.status(200);
        res.send({
          error: err.message
        });
      } else {
        log.info('get_user_info done user = ' + user);
        res.status(200);
        res.send(user);
      }
    });
  }
);

app.get('/api/track/:id',
  function (req, res) {
    routes.getTrack(req.params.id, function (err, track) {
      if (err) {
        log.info('track fail: ' + err.message);
        res.status(200);
        res.send({
          error: 'track not found'
        });
      } else {
        log.info('track done = ' + track);
        res.status(200);
        res.send(track);
      }
    });
  }
);

//web application
app.get('*', function (req, res) {
  log.info('Get '+ req.url);
  res.sendfile('./public' + req.url + '.html', function (err) {
    if (err){
      res.send(404, 'Sorry, we cannot find that!');
    }
  });
});


var port = process.env.OPENSHIFT_NODEJS_PORT || config.get('port');
var ip = process.env.OPENSHIFT_NODEJS_IP || config.get('ip');
http.createServer(app).listen(port, ip, function () {
  log.info('Express server listening on port ' + config.get('port'));
});
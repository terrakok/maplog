var log = require('libs/log')(module);
var config = require('config');
var UserModel = require('models/user');
var TrackModel = require('models/track');
var fs = require('fs');
var imagemagick = require('imagemagick');

function registration(userNick, userEmail, userPassword, callback) {
  log.debug('Registration new user ' + userNick);

  if (userNick && userEmail && userPassword) {

    var user = new UserModel({
      userNick: userNick,
      userEmail: userEmail,
      password: userPassword
    });

    user.save(function (err, user) {
      if (err) {
        log.error('New user ERROR ' + err);
        callback(err);
      } else {
        log.info('New user OK! ' + user);
        callback(null, user);
      }
    });
  } else {
    log.error('Invalid values');
    callback({message: 'Invalid values'});
  }
}
exports.registration = registration;

function saveTrack(userNick, newTrack, callback) {
  log.debug('saveTrack: ' + userNick + ' track = ' + newTrack.title);

  if (userNick && newTrack) {
    newTrack.author = userNick;
    var track = new TrackModel(newTrack);

    track.save(function (err, track) {
      if (err) {
        log.error('saveTrack ERROR ' + err);
        callback(err);
      } else {
        log.info('saveTrack OK! ' + track);

        var points = track.points;
        var photoIDs = [];
        points.forEach(function (point) {
          photoIDs.push(point.fileID);
        });
        renameSavedPhotos(photoIDs);

        callback(null, track._id);
      }
    });
  } else {
    log.error('Invalid values');
    callback({message: 'Invalid values'});
  }
}
exports.saveTrack = saveTrack;

function deleteTrack(userNick, trackID, callback) {
  log.debug('deleteTrack: ' + userNick + ' track = ' + trackID);

  if (userNick && trackID) {
    TrackModel.findOne({ author: userNick, _id: trackID }, function (err, track) {
      if (err) {
        log.error('deleteTrack ERROR ' + err);
        callback(err);
      } else {

        var points = track.points;
        var photoIDs = [];
        for (var point in points) {
          photoIDs.push(point.fileID);
        }
        deletePhotos(photoIDs);

        track.remove(function (err) {
          if (err) {
            log.error('deleteTrack ERROR ' + err);
            callback(err);
          } else {
            log.info('deleteTrack OK! ' + track._id);
            callback(null);
          }
        });
      }
    });
  } else {
    log.error('Invalid values');
    callback({message: 'Invalid values'});
  }
}
exports.deleteTrack = deleteTrack;

function getUserTracks(userNick, callback) {
  log.debug('getUserTracks: ' + userNick);

  if (userNick) {
    TrackModel.find({ author: userNick }, function (err, tracks) {
      if (err) {
        log.error('getUserTracks ERROR ' + err);
        callback(err);
      } else {
        log.info('getUserTracks OK! ' + tracks.length);
        var tracksResult = [];

        tracks.forEach(function (track) {
          var trackTemp = {
            title: track.title,
            author: track.author,
            _id: track._id,
            created: track.created,
            randomPointID: track.points[Math.floor(Math.random() * track.points.length)].fileID
          };
          tracksResult.push(trackTemp);
        });
        callback(null, tracksResult);
      }
    });
  } else {
    log.error('Invalid values');
    callback({message: 'Invalid values'});
  }
}
exports.getUserTracks = getUserTracks;

function getUserInfo(userNick, callback) {
  log.debug('getUserInfo: ' + userNick);

  if (userNick) {
    UserModel.findOne({ userNick: userNick }, function (err, user) {
      if (err) {
        log.error('getUserInfo ERROR ' + err);
        callback(err);
      } else {
        log.info('getUserInfo OK! ' + user);
        callback(null, {  userNick: user.userNick, userAvatar: user.userAvatar });
      }
    });
  } else {
    log.error('Invalid values');
    callback({message: 'Invalid values'});
  }
}
exports.getUserInfo = getUserInfo;

function getFullUserInfo(userNick, callback) {
  log.debug('getFullUserInfo: ' + userNick);

  if (userNick) {
    UserModel.findOne({ userNick: userNick }, function (err, user) {
      if (err) {
        log.error('getFullUserInfo ERROR ' + err);
        callback(err);
      } else {
        log.info('get UserInfo OK! ' + user.userNick);
        var userInfo = {
          userNick: user.userNick,
          userEmail: user.userEmail,
          userAvatar: user.userAvatar
        };

        getUserTracks(userNick, function (err, tracks) {
          if (err) {
            log.info('get UserTracks err! ' + err);
            callback(null, {userInfo: userInfo});
          } else {
            log.info('get UserTracks OK! ' + tracks.length);
            callback(null, {userInfo: userInfo, tracks: tracks});
          }
        });
      }
    });
  } else {
    log.error('Invalid values');
    callback({message: 'Invalid values'});
  }
}
exports.getFullUserInfo = getFullUserInfo;

function getTrack(trackID, callback) {
  log.debug('getTrack: ' + trackID);

  if (trackID) {
    TrackModel.findById(trackID, function (err, track) {
      if (err) {
        log.error('getTrack ERROR ' + err);
        callback(err);
      } else {
        log.info('getTrack OK! ' + track);
        callback(null, track);
      }
    });
  } else {
    log.error('Invalid values');
    callback({message: 'Invalid values'});
  }
}
exports.getTrack = getTrack;

function removePhoto(photoID, callback) {
  log.debug('removePhoto: ' + photoID);

  if (photoID) {
    deletePhotos([photoID]);
    callback(null, photoID);
  } else {
    log.error('Invalid values');
    callback({message: 'Invalid values'});
  }
}
exports.removePhoto = removePhoto;

function getPhoto(photoID, callback) {
  log.debug('getPhoto: ' + photoID);

  if (photoID) {
    var folderPath = config.get('photo_folder_path');
    var filePath = folderPath + '/' + photoID;
    fs.stat(filePath, function (err) {
      if (err) {
        log.debug('not found ' + photoID);
        fs.stat(filePath + '.temp', function (err) {
          if (err) {
            log.debug('not found ' + photoID + '.temp');
            callback(err);
          } else {
            log.debug('Found ' + photoID + '.temp');
            fs.readFile(filePath + '.temp', null, function (err, data) {
              if (err) {
                log.debug('readFile ' + photoID + '.temp ERROR ' + err);
                callback(err);
              } else {
                callback(null, data);
              }
            });
          }
        });
      } else {
        log.debug('Found ' + photoID);
        fs.readFile(filePath, null, function (err, data) {
          if (err) {
            log.debug('readFile ' + photoID + ' ERROR ' + err);
            callback(err);
          } else {
            callback(null, data);
          }
        });
      }
    });
  } else {
    log.error('Invalid values');
    callback({message: 'Invalid values'});
  }
}
exports.getPhoto = getPhoto;

function uploadNewFile(file, callback) {
  log.debug('uploadNewFile: ' + file.path);
  if (file) {
    var folderPath = config.get('photo_folder_path');
    fs.readFile(file.path, function (err, data) {
      if (err) {
        log.error('uploadNewFile readFile ERROR ' + err);
        callback(err);
      } else {
        var fileName = makeid(25);
        var filePath = folderPath + '/' + fileName;

        fs.writeFile(filePath + '.temp', data, function (err) {
          if (err) {
            log.error('uploadNewFile writeFile ERROR ' + err);
            callback(err);
          } else {
            log.info('uploadNewFile OK! ' + fileName);

            var imgThumbnailOpt = {
              srcPath: filePath + '.temp',
              dstPath: filePath + '.thumb',
              strip: false,
              width: 100,
              height: "100^",
              customArgs: [
                "-gravity", "center",
                "-extent", "100x100"
              ]
            };

            imagemagick.resize(imgThumbnailOpt, function (err) {
              if (err) {
                log.info('thumbnail create ERROR ' + err);
                callback(null, fileName);
              } else {
                log.info('thumbnail create OK');
                callback(null, fileName);
              }
            });
          }
        });
      }
    });
  } else {
    log.error('Invalid values');
    callback({message: 'Invalid values'});
  }
}
exports.uploadNewFile = uploadNewFile;


function makeid(lenghId) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < lenghId; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function renameSavedPhotos(photoIDs) {
  var photoFolder = config.get('photo_folder_path');
  photoIDs.forEach(function (photoID) {
    var photoName = photoFolder + '/' + photoID;
    fs.rename(photoName + '.temp', photoName, function (err) {
      if (err) {
        log.error('renameSavedPhotos id = ' + photoName + ' ERROR ' + err);
      } else {
        log.info('renameSavedPhotos id = ' + photoName + ' OK');
      }
    });
  });
}

function deletePhotos(photoIDs) {
  var photoFolder = config.get('photo_folder_path');
  for (var photoID in photoIDs) {
    var photoName = photoFolder + '/' + photoID;
    fs.unlink(photoName, function (err) {
      if (err) {
        log.error('deletePhotos id = ' + photoName + ' ERROR ' + err);
        fs.unlink(photoName + '.temp', function (err) {
          if (err) {
            log.error('deletePhotos id = ' + photoName + '.temp' + ' ERROR ' + err);
          } else {
            log.info('deletePhotos id = ' + photoName + '.temp' + ' OK');
          }
        });
      } else {
        log.info('deletePhotos id = ' + photoName + ' OK');
      }
    });
  }
}
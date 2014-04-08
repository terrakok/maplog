'use strict';

var maplogNewTrack = angular.module('maplogNewTrack', ['angularFileUpload', 'ui.sortable']);

maplogNewTrack.controller('newTrackCtrl', function ($scope, $upload) {
  var map;
  $scope.allFilesArr = [];
  $scope.uploadFiles = [];
  $scope.sortableOptions = {
    axis: 'x'
  };

  initMap();

  $scope.onFileSelect = function ($files) {
    var newFiles = $files;
    var filesCounter = $scope.allFilesArr.length;

    //добавляем все изображения в общий массив
    for (var i = 0; i < newFiles.length; i++) {
      var file = newFiles[i];

      if (window.FileReader && file.type.indexOf('image') > -1) {
        var file_key = filesCounter + i;

        var fileInfo = {
          latitude: null,
          longitude: null,
          description: 'File name: ' + file.name,
          file_id: null,
          file_key: file_key
        }

        $scope.allFilesArr.push(fileInfo);

        (function (key) {
          $scope.uploadFiles[key] = $upload.upload({
            url: SERVER_ADDRESS + 'api/upload_new_photo',
            method: 'POST',
            file: file,
            fileFormDataName: 'newPhoto'
          }).progress(function (evt) {
            // get upload percentage
            console.log(key + ': percent = ' + parseInt(100.0 * evt.loaded / evt.total));
          }).success(function (data, status, headers, config) {
            if (status === 200) {
              updateThumbnail(key, data.fileID);
            } else {
              updateThumbnail(key, '');
            }
          }).error(function (data, status, headers, config) {
            updateThumbnail(key, '');
          });
        })(file_key);
      }
    }
    $scope.$apply();
  }

  $scope.abortUploadFile = function (file_key) {
    $scope.uploadFiles[file_key].abort();
  }

  $scope.getThumbnail = function (fileID) {
    if (fileID) {
      if (fileID.length > 0) {
        return SERVER_ADDRESS + 'api/photo/' + fileID + '.thumb'
      } else {
        return SERVER_ADDRESS + 'img/errorThumb.jpg'
      }
    } else {
      return SERVER_ADDRESS + 'img/loadingThumb.jpg'
    }
  }

  function updateThumbnail(file_key, fileID) {
    $scope.safeApply($scope.allFilesArr.forEach(function (element, index, array) {
      if (element.file_key === file_key) {
        element.file_id = fileID;
      }
    }));
  }

  function initMap() {
    // create the tile layer with correct attribution
    var osmUrl = 'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
    var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
    var osm = new L.TileLayer(osmUrl, {minZoom: 6, maxZoom: 15, attribution: osmAttrib});

    map = L.map('map').setView([51.505, -0.09], 13);
    map.addLayer(osm);
  }

  $scope.safeApply = function (fn) {
    var phase = this.$root.$$phase;
    if (phase == '$apply' || phase == '$digest') {
      if (fn && (typeof(fn) === 'function')) {
        fn();
      }
    } else {
      this.$apply(fn);
    }
  };
});
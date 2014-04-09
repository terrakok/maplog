'use strict';

var maplogNewTrack = angular.module('maplogNewTrack', ['angularFileUpload', 'ui.sortable']);

maplogNewTrack.controller('newTrackCtrl', function ($scope, $upload) {
  var map, markers = [], line;
  $scope.allFilesArr = [];
  $scope.trackTitle = '';
  $scope.uploadFiles = [];
  $scope.sortableOptions = {
    stop: function (e, ui) {
      showMarkers($scope.allFilesArr);
    },
    revert: true,
    axis: 'x'
  };

  initMap();

  $scope.onFileSelect = function ($files) {
    var newFiles = $files;
    var filesCounter = $scope.allFilesArr.length;
    var startPointX = 300;
    var startPointY = 100;

    //добавляем все изображения в общий массив
    for (var i = 0; i < newFiles.length; i++) {
      var file = newFiles[i];

      if (window.FileReader && file.type.indexOf('image') > -1) {
        var file_key = filesCounter + i;
        var pointLatLng = map.containerPointToLatLng([startPointX, startPointY]);
        startPointX += 50;

        var fileInfo = {
          position: pointLatLng,
          description: 'File name: ' + file.name,
          file_id: null,
          file_key: file_key
        }

        $scope.allFilesArr.push(fileInfo);

        (function (key) {
          $scope.uploadFiles[key] = $upload.upload({
            url: SERVER_ADDRESS + 'api/upload_new_photo',
            headers: {'Authorization': 'Bearer ' + getCookie('token')},
            method: 'POST',
            file: file,
            fileFormDataName: 'newPhoto'
          }).progress(function (evt) {
            // get upload percentage
            console.log(key + ': percent = ' + parseInt(100.0 * evt.loaded / evt.total));
          }).success(function (data, status, headers, config) {
            if (status == 200 && !data.error) {
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
    showMarkers($scope.allFilesArr);
    $scope.safeApply();
  }

  $scope.abortUploadFile = function (file_key) {
    $scope.uploadFiles[file_key].abort();
  }

  $scope.getThumbnail = function (fileID) {
    if (fileID !== null) {
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

    line = new L.polyline([], {color: 'red'}).addTo(map);
  }

  function showMarkers(points) {
    markers.forEach(function (marker) {
      map.removeLayer(marker);
    });
    markers = [];

    points.forEach(function (point) {
      var marker = L.marker(point.position, {
        icon: L.icon({
          iconUrl: SERVER_ADDRESS + 'img/pin.png',
          iconSize: [38, 55],
          iconAnchor: [18, 55]
        }),
        title: point.description,
        draggable: 'true'
      });

      marker.on('move', function (e) {
        drawLine();
      });

      marker.on('dragend', function (e) {
        refreshPositionFiles();
      });

      map.addLayer(marker);
      markers.push(marker);
    });
    drawLine();
  }

  function drawLine() {
    var dots = [];
    markers.forEach(function (marker) {
      dots.push(marker.getLatLng());
    });
    line.setLatLngs(dots);
  }

  function refreshPositionFiles() {
    markers.forEach(function (marker, index) {
      $scope.allFilesArr[index].position = marker.getLatLng();
    });
  }

  $scope.clickSave = function saveNewTrack() {
    var trackPoints = [];
    if (!angular.isUndefined($scope.trackTitle)) {
      $scope.allFilesArr.forEach(function (pointItem, i) {
        trackPoints.push({
          latitude: pointItem.position.lat,
          longitude: pointItem.position.lng,
          description: pointItem.description,
          number: i,
          fileID: pointItem.file_id
        });
      });

      var newTrackData = {
        title: $scope.trackTitle,
        points: trackPoints
      };

      var xhr = new XMLHttpRequest();
      var params = JSON.stringify(newTrackData);
      xhr.onloadend = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
          var jsonData = JSON.parse(xhr.responseText);
          if (!jsonData.error) {
            alert('OK: ' + xhr.responseText);
            redirect('new_track');
          } else {
            alert('Error: ' + jsonData.error);
          }
        } else {
          alert('Server not found!');
        }
      };
      xhr.open('POST', SERVER_ADDRESS + 'api/save_track', true);
      xhr.setRequestHeader('Authorization', 'Bearer ' + getCookie('token'));
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(params);
    } else {
      alert('Please enter track title!');
    }
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
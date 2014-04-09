'use strict';

var maplogProfile = angular.module('maplogProfile', []);

maplogProfile.controller('profileCtrl', function ($scope) {
  $scope.profileInfoShow = false;
  $scope.allTracksArr = [];

  var xhr = new XMLHttpRequest();
  xhr.onloadend = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      var jsonData = JSON.parse(xhr.responseText);

      if (!jsonData.error) {
        var userInfo = jsonData.userInfo;
        $scope.userNick = userInfo.userNick + ' ' + userInfo.userEmail;
        if (jsonData.userAvatar) {
          $scope.avatarUrl = SERVER_ADDRESS + 'api/avatar/' + userInfo.userAvatar;
        } else {
          $scope.avatarUrl = SERVER_ADDRESS + 'img/logo_small.png'
        }
        $scope.allTracksArr = jsonData.tracks;
        $scope.profileInfoShow = true;
        $scope.$apply();
      } else {
        alert("Error " + jsonData.error);
      }
    } else {
      alert("Error status = " + xhr.status);
    }
  };
  xhr.open('GET', SERVER_ADDRESS + 'api/get_my_info', true);
  xhr.setRequestHeader('Authorization', 'Bearer ' + getCookie('token'));
  xhr.send(null);

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
});
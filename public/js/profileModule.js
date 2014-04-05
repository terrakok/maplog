'use strict';

var maplogProfile = angular.module('maplogProfile', []);

maplogProfile.controller('profileCtrl', function ($scope) {
    $scope.profileInfoShow = false;
    alert("Error " + getCookie('token'));

    var xhr = new XMLHttpRequest();
    xhr.onloadend = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var jsonData = JSON.parse(xhr.responseText);
            alert("Error " + jsonData);

            if (!jsonData.error) {
                $scope.userNick = jsonData.userNick + ' ' + jsonData.userEmail + ' ' + jsonData.userAvatar;
                $scope.avatarUrl = '../img/avokado.jpg';
                $scope.profileInfoShow = true;
                $scope.$apply();
            } else {
                alert("Error " + jsonData.error);
            }
        } else {
            alert("Server not found!");
        }
    };
    xhr.open('GET', SERVER_ADDRESS + 'get_user_info', true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + getCookie('token'));
    xhr.send(null);
});
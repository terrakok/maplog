'use strict';

var maplogLogin = angular.module('maplogLogin', []);

maplogLogin.controller('loginCtrl', function ($scope) {

  $scope.login = function () {
    var nickName = $scope.nick;
    var pass = $scope.pass;

    if (!validateNick(nickName)) {
      alert('Check your Nickname!');
    } else if (!validatePassword(pass)) {
      alert('Check your Password!');
    } else {
      var xhr = new XMLHttpRequest();
      var params = 'grant_type=password'
        + '&client_id=' + CLIENT_ID
        + '&client_secret=' + CLIENT_SECRET
        + '&username=' + encodeURIComponent(nickName)
        + '&password=' + encodeURIComponent(pass);
      xhr.onloadend = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
          var jsonData = JSON.parse(xhr.responseText);
          if (!jsonData.error) {
            alert('Login OK! token = ' + jsonData.access_token);
            deleteCookie("token");
            setCookie("token", jsonData.access_token, {
              path: "/"
            });
          } else {
            alert("Error: " + jsonData.error);
          }
        } else {
          alert("Server not found!");
        }
      };
      xhr.open('POST', SERVER_ADDRESS + 'api/token', true);
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.send(params);
    }
  }
});

function validateNick(nickName) {
  var re = /\w{3,24}/;
  return re.test(nickName);
}

function validatePassword(pass) {
  var re = /^.*(?=.{8,})(?=.*[a-zA-Z])(?=.*\d)(?=.*[!#$%&? "]).*$/;
  return re.test(pass);
}
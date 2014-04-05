'use strict';

var maplogJoin = angular.module('maplogJoin', []);

maplogJoin.controller('joinCtrl', function ($scope) {

    $scope.registration = function () {
        var nickName = $scope.nick;
        var email = $scope.email;
        var pass = $scope.password;

        if (!validateEmail(email)) {
            alert('Check your email address!');
        } else if (!validateNick(nickName)) {
            alert('Check your Nickname!');
        } else if (!validatePassword(pass)) {
            alert('Check your Password!');
        } else {
            var xhr = new XMLHttpRequest();
            var params = 'usernick=' + encodeURIComponent(nickName) + '&useremail=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(pass);
            xhr.onloadend = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    var jsonData = JSON.parse(xhr.responseText);
                    if (!jsonData.error) {
                        alert('Registration OK! nick = ' + jsonData.usernick);
                    } else {
                        alert("Error: " + jsonData.error);
                    }
                } else {
                    alert("Server not found!");
                }
            };
            xhr.open('POST', SERVER_ADDRESS + 'registration', true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.send(params);
        }
    }
});

function validateNick(nickName) {
    var re = /\w{3,24}/;
    return re.test(nickName);
}

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function validatePassword(pass) {
    var re = /^.*(?=.{8,})(?=.*[a-zA-Z])(?=.*\d)(?=.*[!#$%&? "]).*$/;
    return re.test(pass);
}

function redirect(addr) {
    document.location.href = '' + addr + '.html';
}

function getCookie(name) {
    var matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

function deleteCookie(name) {
    setCookie(name, "", {
        expires: -1
    })
}

function setCookie(name, value, options) {
    options = options || {};

    var expires = options.expires;

    if (typeof expires == "number" && expires) {
        var d = new Date();
        d.setTime(d.getTime() + expires * 1000);
        expires = options.expires = d;
    }
    if (expires && expires.toUTCString) {
        options.expires = expires.toUTCString();
    }

    value = encodeURIComponent(value);

    var updatedCookie = name + "=" + value;

    for (var propName in options) {
        updatedCookie += "; " + propName;
        var propValue = options[propName];
        if (propValue !== true) {
            updatedCookie += "=" + propValue;
        }
    }

    document.cookie = updatedCookie;
}
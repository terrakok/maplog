var crypto = require('crypto');
var mongoose = require('libs/mongoose');

var Schema = mongoose.Schema;

var User = new Schema({
  userNick: {
    type: String,
    unique: true,
    required: true
  },
  hashedPassword: {
    type: String,
    required: true
  },
  salt: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  userEmail: {
    type: String,
    unique: true,
    required: true
  },
  userAvatar: {
    type: String,
    unique: false,
    required: false
  }
});

// validation
User.path('userNick').validate(function (v) {
  return v && v.length > 2 && v.length < 25;
}, 'Invalid userNick');

User.path('userEmail').validate(function (v) {
  return v && v.length > 2 && v.length < 25;
}, 'Invalid userEmail');

User.methods.encryptPassword = function(password) {
  return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
};

User.virtual('userId')
  .get(function() {
    return this.id
  });

User.virtual('password')
  .set(function (password) {
    this._plainPassword = password;
    this.salt = Math.random() + '';
    this.hashedPassword = this.encryptPassword(password);
  })
  .get(function () {
    return this._plainPassword;
  });

User.methods.checkPassword = function(password) {
  return this.encryptPassword(password) === this.hashedPassword;
};

module.exports = mongoose.model('User', User);
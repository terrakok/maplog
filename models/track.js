var mongoose = require('libs/mongoose');
require('mongoose-double')(mongoose);

var Schema = mongoose.Schema;

var SchemaTypes = mongoose.Schema.Types;
var Points = new Schema({
  latitude: {
    type: SchemaTypes.Double,
    required: true
  },
  longitude: {
    type: SchemaTypes.Double,
    required: true
  },
  description: {
    type: String
  },
  number: {
    type: Number,
    required: true
  },
  fileID: {
    type: String,
    required: true,
    unique: true
  }
});

var Track = new Schema({
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  points: [Points],
  created: {
    type: Date,
    default: Date.now
  }
});

// validation
Track.path('title').validate(function (v) {
  return v && v.length > 2 && v.length < 100;
}, 'Invalid title');

module.exports = mongoose.model('Track', Track);
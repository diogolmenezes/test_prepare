var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var PeopleSchema = new Schema({
    name: { type: String, required: true },
    age: Number
}, { collection: 'people' });

module.exports = mongoose.model('People', PeopleSchema);
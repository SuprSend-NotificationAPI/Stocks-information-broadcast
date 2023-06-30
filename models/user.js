const mongoose = require('mongoose');
const {Schema, model} = mongoose;

const UserSchema = new Schema({
  username: {type: String, required: true},
  name : String,
  phone : {type:Number},
});

const UserModel = model('User-stock', UserSchema);

module.exports = UserModel;
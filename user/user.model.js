import mongoose from 'mongoose';

// set schema/rule/structure
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  gender: String,
  role: String,
});

// create table/collection/model
const User = mongoose.model('User', userSchema);

export default User;

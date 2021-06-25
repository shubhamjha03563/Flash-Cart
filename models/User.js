const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  googleId: {
    type: String,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function (v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email',
    },
  },
  password: {
    type: String,
    trim: true,
    select: false,
    // required: [true, 'Please give a password'],
    // minLength: [6, 'Password should be atleast 6 characters long'],
  },
  cartItems: [
    {
      itemId: { type: mongoose.Schema.ObjectId, ref: 'Item' },
      quantity: { type: Number, default: 1 },
    },
  ],
});

UserSchema.pre('save', async function (next) {
  if (this.password) {
    const salt = bcrypt.genSaltSync();
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('user', UserSchema);

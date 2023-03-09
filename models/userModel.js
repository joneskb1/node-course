const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User must have a name'],
  },
  email: {
    type: String,
    required: [true, 'User must have an email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'User must enter a password'],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'passwords must match'],
    validate: {
      // only works on Create/SAVE not update!
      validator: function (el) {
        return this.password === el;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  // only run if password was modified
  if (!this.isModified('password')) {
    return next();
  }
  // encrypt password, cost num => higher is better protection but takes longer to run
  this.password = await bcrypt.hash(this.password, 12);
  // reset passwordConfirm, don't store in db
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  // subtracting 1 sec ensures token is always created after password is changed
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // password changed after token
    return JWTTimestamp < changedTimestamp;
  }

  // not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // creating token
  const resetToken = crypto.randomBytes(32).toString('hex');
  // encrypting token for DB
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // set expiration + 10min * 60 sec * 1000 ms
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  // returning token for email
  return resetToken;
};

const User = mongoose.model(`User`, userSchema);

module.exports = User;

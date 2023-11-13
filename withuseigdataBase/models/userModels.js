// import mongoose driver
const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bycrpt = require("bcryptjs");
// name, email ,password, confirmPassword, photo
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "the user must have a name"],
  },
  email: {
    type: String,
    required: [true, "the user must have email"],
    unique: true,
    validate: [validator.isEmail, "please provide your email"],
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false,
  },
  confirmPassword: {
    type: String,
    required: true,
    validate: {
      // this will only work on [.create()] and [.save() :maybe we will use this way to create new user or to update]
      validator: function (value) {
        return value === this.password;
      },
    },
  },
  role: {
    type: String,
    enum: ["user", "guied", "lead-guied", "admin"],
    default: "user",
  },
  photo: {
    type: String,
  },
  passwordChangeAt: Date,
  passwordResetToken: String,
  passwordResetExpire: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// I would argue the best place to do this kind of functionalty like encryption password is the model file beacese we deal with data itself
// password encryption
// the time I woulde like to manpulate the date is the moment I reviced the data and berfore persiste on the database so the best way to do that use mongoose middelware (documents middelware)
/*encrypt password before save it in the database */
userSchema.pre("save", async function (next) {
  // when we want to encrpty the password ? when create new one or update it
  if (!this.isModified("password")) {
    return next();
  }
  // hash the password and add cost
  this.password = await bycrpt.hash(this.password, 12);
  // delete the confirmPassword
  this.confirmPassword = undefined;
});

//update changePasswordAt after rest password
// this is in charge for change the passwordChangeAt field if the password have changed
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) {
    return next();
  }
  // I have substracted (1000) actually it will work fine but because usually token creted a bit before the changePassword timestamp has been created
  // the token created a bit before save update changePassword timestamp in the database
  // so we solve that by substract (1000 ms) (1s)
  this.passwordChangeAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ actice: { $ne: false } });
  next();
});

// -------------------------------------------------------------------------------------------------
// we will use bcrypt packge to compare the orignal password and the password that user provieds
// to create instacne method we can use the (schema name and medthods prototype then the name of instacne method) and this instance method is async method
// candidatePassword : the password that will client provied
// userPassword : the orignal password that we have already hash it
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return bycrpt.compare(candidatePassword, userPassword);
};

//----------- this instancec method is in charge for compare between the issued time of token and time of change password
userSchema.methods.checkChangePassword = function (JWTTimestamp) {
  if (this.passwordChangeAt) {
    console.log(this.passwordChangeAt, JWTTimestamp);
    const changePasswordTime = parseInt(
      this.passwordChangeAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changePasswordTime;
  }
  // by default we will return false
  return false;
};

//-------- I will create instnce method to generate rest token
// the token should be encrypted but not as password it should be more simple encryption so I will use [crypto module] to create [random bytes]
// crypto.randomBytes(number of bytes).
userSchema.methods.createPasswordRestToken = function () {
  // this line create palin text contain 32 chars
  const resetToken = crypto.randomBytes(32).toString("hex");
  // I will encrypt this restToken by use crypto onec agine
  // hash(kind of encryption) , update(the part that you want to encrypt it), digest(in which number system do you want this resulte appeare)
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  // set the value of passwordResetExpire
  this.passwordResetExpire = Date.now() + 10 * 60 * 1000;
  console.log({ resetToken }, this.passwordResetToken);
  // we need to return the restToken because we want to send it to email
  return resetToken;
};

// instance method to update changePasswordAt
userSchema.methods.changePassowrdAt = function (changePassowrdAt) {
  this.changePassowrdAt = changePassowrdAt;
};

// instacne method to update the current password
userSchema.methods.updateCurrentPassword = function (newPassword) {
  this.password = bycrpt.hash(newPassword, 12);
  console.log(newPassword);
};
const Users = mongoose.model("User", userSchema);
module.exports = Users;

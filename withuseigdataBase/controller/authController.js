const Users = require("./../models/userModels");
const jwt = require("jsonwebtoken");
// import util package
const util = require("util");
// import sendEmail
const sendEmail = require("../utils/email");
const crypto = require("crypto");

const signingUp = (id) => {
  return jwt.sign({ id: id }, process.env.SECRET_KEY, {
    expiresIn: process.env.EXPIERD_IN,
  });
};

// I have to change all thing below related with token
const createAndSendToken = (user, statusCode, res) => {
  // I will set the json web token in the cookie
  const token = signingUp(user._id);
  res.cookie("jwt", token, {
    expiresIn:
      new Date(Date.now()) +
      process.env.EXPIERD_COOKIE_IN * 24 * 60 * 60 * 1000,
    // this equation for convert from days to ms
    secure: true, // the josn web token will only be send in an encryption connection with (HTTPS) but https not available unitl now
    httpOnly: true, // the cookie cannot access or modified by browsers , the browser will recives the token and send it back with each request that need it
  });

  return res.status(statusCode).json({
    token,
    status: "success",
    data: {
      user,
    },
  });
};

exports.signup = async (req, res) => {
  try {
    // usually applications website logged in directly when new user sign up
    // so we need to create token for that
    const newUser = await Users.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      passwordChangeAt: req.body.passwordChangeAt,
      role: req.body.role,
    });
    // const token = signingUp(newUser._id);
    // res.status(200).json({
    //   status: "success",
    //   token,
    //   data: {
    //     newUser,
    //   },
    // });
    createAndSendToken(newUser, 200, res);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    // extract the email and password from req.body to check them
    const { email, password } = req.body;
    // 1) check if the email and the password are exists
    if (!email || !password) {
      return res.json({
        status: "provied email and password",
      });
    }
    // 2) check if the user exist & the password is correct

    // we need here to make query to chaeck if the user exist or not
    const user = await Users.findOne({ email }).select("+password role");
    // we need to compare the orignal password and the password that user provieds the best place to do that is the model file beacuse the date related itself
    // so as we said all the documents have access to the instance method
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.json({
        status: "filed",
        message: "email or password invalied",
      });
    }
    createAndSendToken(user, 200, res);
    // const token = signingUp(user._id);
    // res.status(200).json({
    //   token,
    // });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    // console.log(req.headers);
    // 1) we need to get the token and check if it exists or not and we need to check if it start with "Berare"
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // if true we will assgin the token value to the token variable
      token = req.headers.authorization.split(" ")[1];
    }
    // check if the token exists or not if false the handler will return error if true will complete the funcction
    if (!token) {
      return res.status(401).json("you are not authorized");
    }

    // 2)verfication token (we need to make sure if the token is valid or not) and if the token valide we will extract the data we put it when issued the web token;
    const decoded = await util.promisify(jwt.verify)(
      token,
      process.env.SECRET_KEY
    );
    // console.log("decodeddecodeddecoded", decoded);
    //3)check if the user still exists
    const currentUser = await Users.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        message: "the user who belong to this token does not exists",
      });
    }

    //4)check if the user change the password after issued the token
    if (currentUser.checkChangePassword(decoded.iat)) {
      return res.status(401).json({
        message: "user change the password recently, plesae login agin",
      });
    }
    // set the data of user into the req
    req.user = currentUser;
    // GRANT ACCESS TO THE (PROTECTED ROUTE THE HANDLER WHICH SEND BACK THE DATA TAHT WAS PROTECTED)
    next();
  } catch (error) {
    res.status(500).json({
      messgae: error.message,
    });
  }
};

// this wrap function to return the middelware function result because we usually can't set parameters in the middelware
exports.restrictTo = (...roles) => {
  // restrict middelware to restrcit user permissions depend on their roles
  return (req, res, next) => {
    try {
      if (!roles.includes(req.user.role)) {
        // 403 : that's mean forbidden
        return res.status(403).json({
          message: "you don't have permssion to do this action",
        });
      }
      next();
    } catch (error) {
      return res.status(500).json({
        message: error.message,
      });
    }
    // roles is an array of roles ["admin", "lead-guied"] if user role one of them return true
  };
};

// here I will implement the forgetpassword algorithem
// this process devied into two part:
// 1)forgotpassword --> in this process basiclly send [post request] to [forget route] only with the [email address] and then it will create [reandom rest token]
// [random rest token] -> used by user to create new password
// to create rest token we need instance method in the user model because we deal with data itself

exports.forgotPassword = async (req, res) => {
  // 1) find the user based on email [beacuse we just have the email in this case]
  const user = await Users.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({ status: "user does not exists" });
  }

  // 2)create [random rest token]
  const restToken = user.createPasswordRestToken();
  user.save({ validateBeforeSave: false });

  // 3) send [restToken] to email
  sendEmail({
    email: req.body.email,
    subject: "Reset Password",
    text: `to rest the password you should hit the following link
${restToken}
      `,
    html: `
      <h1>ahmad alshobaki.com</h1>
      `,
  });

  return res.status(200).json({
    status: "success",
    message: "we sent the token to email",
  });
};

exports.resetPassword = async (req, res) => {
  //1) get user based on rest token (we should Re-encrypte the rest token that we recived via email)
  const encryptedResetToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  //2)Check if the token doesn't expired and the user exists reset new password
  const user = await Users.findOne({
    passwordResetToken: encryptedResetToken,
    passwordResetExpire: { $gt: Date.now() },
    // this statement mena if the token expierd or not beacuse we set the time of token [Date.now() + 10 * 60 * 1000]
    // [Date.now() + 10 * 60 * 1000] grater than this one [Date.now()]
  });
  if (!user) {
    return res.status(400).json({
      message: "user does not exists or token expierd",
    });
  }
  // we just handle reset password process
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  // we need to use save here beacause we want run all vlidator and all middleware work when we save the the doc
  await user.save();

  // 3)update changePasswordAt property for the user
  user.changePassowrdAt(Date.now());

  //4) log user in , send jwt token
  createAndSendToken(user, 201, res);

  // const token = signingUp(user._id);
  // res.status(200).json({
  //   status: "sucess",
  //   token,
  // });
};

exports.Updatepassword = async (req, res, next) => {
  // 1) get the user from the collection
  const currentLoggedInUser = await Users.findById(req.user.id).select(
    "+password"
  );
  // 2) check if POSTed current password is correct
  const cehckCurrentPassowrd = await currentLoggedInUser.correctPassword(
    req.body.passwordCurrent,
    currentLoggedInUser.password
  );

  if (!cehckCurrentPassowrd) {
    res.status(401).json({
      message: "your current password is wrong, try agin",
    });
  }
  //3) if so, update the current password
  currentLoggedInUser.password = req.body.password;
  currentLoggedInUser.confirmPassword = req.body.confirmPassword;
  // to save the newPassword in the database
  await currentLoggedInUser.save();
  //4) we didn't use [findByIdAndUpdate] because doesn't [trigger] the validator work in the model file or scehma
  createAndSendToken(currentLoggedInUser, 201, res);
  // const token = signingUp(currentLoggedInUser._id);
  // res.status(200).json({
  //   token,
  // });
};

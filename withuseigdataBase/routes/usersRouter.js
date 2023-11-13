const express = require("express");
const userController = require("./../controller/userController");
const authController = require("./../controller/authController");

const router = express.Router(); // users middleWare

// sign up endpoint
router.post("/signup", authController.signup);

// login endpoint
router.post("/login", authController.login);

// forgot Password routes
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:resetToken", authController.resetPassword);

// update currentPassword
router.patch(
  "/updateCurrentPassowrd",
  authController.protect,
  authController.Updatepassword
);

// update current user data
router.patch("/updateMe", authController.protect, userController.updateMe);

router.delete("deletMe", authController.protect, userController.deleteMe);

// users route
router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;

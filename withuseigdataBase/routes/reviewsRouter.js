const express = require("express");
const reviewsController = require("../controller/reviewController");
const authController = require("../controller/authController");
const router = express.Router();

router.route("/").get(reviewsController.getAllReviews).post(
  // only the authenticated user will be able to post [review] and they must be regular [user] not [tour giude or admin]
  authController.protect,
  authController.restrictTo("user"),
  reviewsController.createReview
);

module.exports = router;

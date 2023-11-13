const express = require("express");
const toursController = require("../controller/tourController");
const authController = require("../controller/authController");
const reviewController = require("../controller/reviewController");
const router = express.Router(); // Router middleWare
router
  .route("/top-5-cheap")
  .get(toursController.aliasTopTours, toursController.getAllTours);

router.route("/tour-stats").get(toursController.getTourStats);
router.route("/monthly-plan/:year").get(toursController.getMonthlyPlan);

router
  .route(`/`)
  .get(authController.protect, toursController.getAllTours)
  .post(toursController.createTour);
router
  .route("/:id")
  .get(toursController.getTour)
  .patch(toursController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guied"),
    toursController.deleteTour
  );

// POST/toure/:toureId/reviews (create new review)
// GET/toure/:toureId/reviews (to get all reviews into specific tour)
// GET/toure/:toureId/reviews/:reviewId (to get specific review into specific tour)

router
  .route("/:tourId/reviews")
  .post(authController.protect, reviewController.createReview); //to create new review user have to be authenticated to do that
router.route("/:toureId/reviews").get();
router.route("/:toureId/reviews/:reviewId").get();

module.exports = router;

const Review = require("../models/reviewsModel");

// create new review
exports.createReview = async (req, res) => {
  try {
    if (!req.body.tour) {
      req.body.tour = req.params.tourId;
    }
    if (!req.body.user) {
      req.body.user = req.user._id;
    }
    console.log(req.user);
    const newReview = await Review.create(req.body);
    return res.status(200).json({
      status: "sucess",
      data: {
        Review: newReview,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: "falid",
      message: err.message,
    });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find();
    res.status(200).json({
      status: "sucess",
      data: {
        reviews,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

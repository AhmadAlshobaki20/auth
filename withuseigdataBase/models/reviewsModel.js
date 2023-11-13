const mongoose = require("mongoose");

const reviewsSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: true,
    },
    reating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: { type: Date, default: Date.now() },
    // tour Referance
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "review must belong to the tour"],
    },
    // user Referance
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "review must belong to the user"],
    },
  },
  { timestamps: true }
);

// user -> review (1:Many -> each user can write multiple reviews but only one review belong to the one user)
// toure -> review (1:Many -> each tour can have multiple reviews but only one review belong to the one review)

reviewsSchema.pre(/^find/, function (next) {
  //  I rid of the first paopulate beacuse to cause populate chain and we don't actually need that  
  // this.populate({
  //   path: "tour",
  //   select: "name",
  // }).populate({
  //   path: "user",
  //   select: "name photo",
  // });
  this.populate({
    path: "user",
    select: "name photo",
  });
  next();
});

const Review = mongoose.model("Review", reviewsSchema);

module.exports = Review;

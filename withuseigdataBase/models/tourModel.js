const mongoose = require("mongoose");
const slugify = require("slugify");
// const User = require("./userModels");
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxlength: [40, "A tour name must have less or equal then 40 characters"],
      minlength: [10, "A tour name must have more or equal then 10 characters"],
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium, difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: "Discount price ({VALUE}) should be below regular price",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a description"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    // this field actaully is an embedded object to descripe the startLocation that the tour will start from there
    startLocation: {
      type: {
        type: String, // this here refer to the type of the type proparity
        default: "Point", // this refer to type of geomitry that will apper on the map
        enum: ["Point"], // this here we specify what the possible data that startLocation will take
      },
      coordinates: [Number], //this proparity is in charge for the longitude and latitude
      address: String, //descripte the address
      description: String, // descrption about the address,
    },
    // as you know each tour can have several locations so we need to add new embedded array of object to perform that
    locations: [
      {
        type: {
          type: String, // this here refer to the type of the type proparity
          default: "Point", // this refer to type of geomitry that will apper on the map
          enum: ["Point"], // this here we specify what the possible data that startLocation will take
        },
        coordinates: [Number], //this proparity is in charge for the longitude and latitude
        address: String, //descripte the address
        description: String, // descrption about the address,
        day: Number, //descripe how many day the tour will keep in each location
      },
    ],
    // embedding user giudes array guides: Array,
    guides: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});
// VIRTULA POPULATE(used to populated data without persiste (store) it in the databaes just virtualy) it is usfule when we don't want the array of child-reference to grow up
tourSchema.virtual("reviews", {
  ref: "Review", // refenece model
  foreignField: "tour", // refer to the filed in the other model in this case is [Review model]
  localField: "_id", // refer to the field in the current model in this casde is [Tour model]
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// this doc middelware to populate the data
tourSchema.pre(/^find/, function (next) {
  // this here refer to the current document
  console.log("ahmad I'm working");
  this.populate({
    path: "guides",
    select: "-__V -passwordChangeAt",
  });
  next();
});

//(knowlegd) this middelware is in charge for embedding the corrospnding user of the IDs the I will add them when I create newTour
// tourSchema.pre("save", async function (next) {
//   const guidesPromieses = this.guides.map(async (id) => {
//     return await User.findById(id);
//   });
//   this.guides = await Promise.all(guidesPromieses);
//   console.log("this.guides",this.guides);
//   next();
// });

// tourSchema.pre('save', function(next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
// tourSchema.pre('find', function(next) {
// tourSchema.pre(/^find/, function(next) {
//   this.find({ secretTour: { $ne: true } });
//   this.start = Date.now();
//   next();
// });

// tourSchema.post(/^find/, function(docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds!`);
//   next();
// });

// // AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;

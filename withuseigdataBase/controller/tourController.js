const Tour = require("./../models/tourModel");
const APIFeatures = require("../utils/apiFeatures");

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    // EXECUTE QUERY
    // Tour.find() return query
    // let apiFeatures = new APIFeatures(Tour.find(), req.query).sort()
    // const tours = await apiFeatures.dbQuery;
    const tours = await Tour.find();
    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

// exports.getAllTours = async (req, res) => {
//   try {
//     // EXECUTE QUERY
//     const queryObj= {...req.query};
//     const excludedFeatures = ['sort', 'page', 'fields', 'limit']
//     excludedFeatures.forEach((el)=>{
//       delete queryObj[el];
//     })

//     // AdvanceFilter [$gte, $gt, $lte,$lt]
//     let queryString = JSON.stringify(queryObj);
//     queryString = queryString.replace((/\b(gte|gt|lt|lte)\b/g),match=> `$${match}`);
//     let query = Tour.find(JSON.parse(queryString));

//     // sorting
//     // sort("field1 [field2 field3 ...]") without comma
//     if(req.query.sort){
//       const sortBy = req.query.sort.split(',').join(' ')
//       query = query.sort(sortBy);
//     }

//     // fields
//     // select spesfic fields
//     if(req.query.fields){
//       const fields = req.query.fields.split(',').join(' ');
//       query = query.select(fields);
//     }

//     // limitation
//     if(req.query.limit){
//       const page = req.query.page * 1 || 1
//       const limit = req.query.limit * 1 || 5;
//       const skip = limit * (page - 1);
//       // example
//       // 20 documents each 10 page each page will take 2 documents
//       // 2 * (2 - 1) = skip 2 documents and show form [3 - 5] in page (2)
//       query = query.skip(skip).limit(limit);
//     }

//     const tours = await query;

//     // SEND RESPONSE
//     res.status(200).json({
//       status: 'success',
//       results: tours.length,
//       data: {
//         tours
//       }
//     });
//   } catch (err) {
//     res.status(404).json({
//       status: 'fail',
//       message: err
//     });
//   }
// };

exports.getTour = async (req, res) => {
  try {
    // .populate("NMAEOFFIELD") or .populate({ path:"NAMEOFFIELD", select:""})
    const tour = await Tour.findById(req.params.id).populate({
      path: "reviews",
      select: "reviwe",
    });
    // Tour.findOne({ _id: req.params.id })
    res.status(200).json({
      status: "success",
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    // const newTour = new Tour({})
    // newTour.save()

    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: { $toUpper: "$difficulty" },
          numTours: { $sum: 1 },
          numRatings: { $sum: "$ratingsQuantity" },
          avgRating: { $avg: "$ratingsAverage" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
      // {
      //   $match: { _id: { $ne: 'EASY' } }
      // }
    ]);

    res.status(200).json({
      status: "success",
      data: {
        stats,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1; // 2021

    const plan = await Tour.aggregate([
      {
        $unwind: "$startDates",
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$startDates" },
          numTourStarts: { $sum: 1 },
          tours: { $push: "$name" },
        },
      },
      {
        $addFields: { month: "$_id" },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: { numTourStarts: -1 },
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        plan,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

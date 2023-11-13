const express = require("express");
const morgan = require("morgan");
// import express-rate-limit (it is in charge for limit the request for per IP address)
const rateLimit = require("express-rate-limit");
// import helmet pagckag (it is in charge for set security HTTP Headers in order to prevent from DNS, XSS ,ect...)
const helmet = require("helmet");
// import express-mongo-sanitize (it is in charge for protect aginsts NoSQL injection)
const mongoSanitization = require("express-mongo-sanitize");
// import xss-clean (it is responsible for protect aginist xss attacks)
const XSS = require("xss-clean");
// import the routers for mounting process
const tourRouter = require("./routes/touresRouter");
const userRouter = require("./routes/usersRouter");
const reviewRouter = require("./routes/reviewsRouter");

const app = express();

// 1)GLOBAL MIDDLEWARES

// Security HTTP Headers (we should use helmet early to sure that these headers will set)
app.use(helmet());

// devlopment logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// limit request from the same API
const limiter = rateLimit({
  max: 100, // how many request for per IP address,
  windowMs: 60 * 60 * 1000, // this is in charge for how many time requrest those the (max request)
  message: "Too many request by this ip address",
});
app.use("/api", limiter); // I sepecify where the limiter should run

// Body parser, reading data from the body into req.body
app.use(express.json());

// security middelware express-mongo-sanitization (this middelware look at the req.body, req.params and req.query and then it will filter out all the [$])
app.use(mongoSanitization());

//security middelware xss-clean (this middelware responsibel for clean the data that comeing to the application from html malicous code)
app.use(XSS());

app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  console.log("Hello from the middleware 👋");
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
module.exports = app;

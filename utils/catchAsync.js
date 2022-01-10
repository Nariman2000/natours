// Catching Errors instead of try catch block Asynchornously

module.exports = catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};

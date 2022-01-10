// MODEL
const { Review } = require('../models/reviewModel');
const factory = require('./handlerFactory');

exports.setTourUserIDs = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourID;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.createReview = factory.createOne(Review);
exports.getAllReviews = factory.getAll(Review);
exports.updateReview = factory.updateOne(Review);
exports.getOneReview = factory.getOne(Review, 'review');
exports.deleteReview = factory.deleteOne(Review, 'review');

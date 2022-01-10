const express = require('express');

const router = express.Router();

// CONTROLLER
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
// const reviewController = require('../controllers/reviewController');

const reviewRouter = require('./review');

// CHECK_ID
// router.param('id', tourController.check_ID);

// const hi = (req, res, next) => {
//   console.log('Hello dear ...');
//   next();
// };

router.use('/:tourID/reviews', reviewRouter);

// Getting top five cheap tours by default
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopCheap, tourController.getAllTours);

// Aggrigation_pipeline
router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

// Geo-Data
router
  .route('/tours-within/:distance/center/:latlang/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlang/unit/:unit').get(tourController.getDistances);

// Protect GetAllTours for loged in users
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

// Authorize for delete tours for some certain users (ADMIN)
router
  .route('/:id')
  .get(tourController.getOneTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

// router
//   .route('/:tourID/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

module.exports = router;

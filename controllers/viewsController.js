const { Tour } = require('../models/tourModel');
const { User } = require('../models/userModel');
const { AppError } = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// OVERVIEW PAGE
exports.getOverview = catchAsync(async (req, res) => {
  // 1- Get tour data from collection
  const tours = await Tour.find();

  // 2- Build template
  // 3- Render that template usign tour data from 1
  res.status(200).render('overview', {
    title: 'All tours',
    tours,
  });
});

// TOUR DETAILS PAGE
exports.getTour = catchAsync(async (req, res, next) => {
  // 1- Get data, for the requested tour: [include reviews,tour guides]
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }

  // 2- Build template
  // 3- Render that template usign tour data from 1
  res
    .status(200)
    .set({
      'Content-Security-Policy': `default-src 'self' http: https:;block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data: blob:;object-src 'none';script-src 'self' https://api.mapbox.com https://cdn.jsdelivr.net 'unsafe-inline' 'unsafe-eval';script-src-elem https: http: ;script-src-attr 'self' https://api.mapbox.com https://cdn.jsdelivr.net 'unsafe-inline';style-src 'self' https://api.mapbox.com https://fonts.googleapis.com 'unsafe-inline';worker-src 'self' blob:`,
    })
    .render('tour', {
      title: req.params.slug,
      tour,
    });
});

// LOG_IN PAGE
exports.getLoginForm = catchAsync(async (req, res) => {
  res.status(200).render('login', {
    title: 'Log in to your account',
  });
});

// SIGN_UP PAGE
exports.getSignUpForm = catchAsync(async (req, res) => {
  res.status(200).render('sign-up', {
    title: 'Sign-up your account',
  });
});

// ACCOUNT
exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

// exports.updateUserData = async (req, res, next) => {
//   const updatedtUser = await User.findByIdAndUpdate(
//     req.user.id,
//     {
//       name: req.body.name,
//       email: req.body.email,
//     },
//     {
//       new: true,
//       runValidators: true,
//     }
//   );

//   res.status(200).render('account', {
//     title: 'Your account',
//     user: updatedtUser,
//   });
// };

const { promisify } = require('util');
const crypto = require('crypto');

const jwt = require('jsonwebtoken');

const { User } = require('../models/userModel');
const { AppError } = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');

const createToken = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.cookie('jwt', token, {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 100),
    httpOnly: true,
  });

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// SIGN_UP USER
exports.sign_up = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm, passwordChangedAt, role } =
    req.body;

  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    passwordChangedAt,
    role,
  });
  // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN,
  // });
  // res.status(201).json({
  //   status: 'Success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });

  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  createToken(newUser, 201, res);
});

// LOG_IN USER
exports.log_in = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1- Check if email & password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2- Check if user exists & password is correct
  const user = await User.findOne({ email }).select('+password');

  // Use bcrypt.compare from instances methods
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3- If every thing is ok, send TOKEN to client
  // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN,
  // });

  // res.status(200).json({
  //   status: 'Success',
  //   token,
  // });
  createToken(user, 200, res);
});

// LOG_OUT
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

// PROTECT MIDDLEWARE
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1- Getting Token & check if exist
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  // console.log(token);

  if (!token) {
    return next(
      new AppError('You are not logged-in please log-in to get access', 401)
    );
  }

  // 2- Validate (Verify) Token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  // 3- Check if the User exist
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError('The User does no longer exist!', 401));
  }

  // 4- Check if user change password after Token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'User changed the password recently please Log-in again',
        401
      )
    );
  }

  // GRANT ACCESS TO PROTECTED ROUT
  // Put Entire User Data in Request :
  req.user = freshUser;

  // for template using
  res.locals.user = freshUser;

  next();
});

// RESTRICT CERTAIN USERS
// Roles is an array should includes admin and lead-guide

exports.restrictTo = function (...roles) {
  // console.log(roles);
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to do this action', 403)
      );
    }

    next();
  };
};

// FORGOT PASSWORD
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1- Get User based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no email with that email address', 404));
  }

  // 2- Generate random token not jwt
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    // 3- Send it to User email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'Success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.log(err);

    return next(
      new AppError('There was an error sending email, please try again.', 500)
    );
  }
});

// RESET PASSWORD
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1- Get user based on the Token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2- If Token was'nt expired and there is a user, set new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 3- Update changedPasswordAt property for user
  // handle in userSchema Model

  // 4- Log the user in, send JWT Token
  // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN,
  // });

  // res.status(200).json({
  //   status: 'Success',
  //   token,
  // });
  createToken(user, 200, res);
});

// UPDATE PASSWORD
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1- Get User from collection (ID came from LOGGED-IN)
  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new AppError('No user exist with this ID', 400));
  }
  // 2- Check the password if it's correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError(`You're password is wrong`, 401));
  }

  // 3- Update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4- Logged in user, send JWT
  // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN,
  // });

  // res.status(200).json({
  //   status: 'Success',
  //   token,
  // });
  createToken(user, 200, res);
});

// CHECK IF USER LOGGED_IN (only for rendered pages)
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1- Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2- Check if the User exist
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next();
      }

      // 3- Check if user change password after Token was issued
      if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS LOGGED IN USER
      // User in front end for pug
      res.locals.user = freshUser;
      return next();
    } catch {
      return next();
    }
  }
  next();
};

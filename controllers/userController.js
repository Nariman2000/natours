const multer = require('multer');
const sharp = require('sharp');

const { AppError } = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { User } = require('../models/userModel');
const factory = require('./handlerFactory');

// MULTER CONFIG
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },

//   filename: (req, file, cb) => {
//     // user-userID-currentTimestamp.png
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
const multerStorage = multer.memoryStorage();

// FILTER
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! please only upload images', 400), false);
  }
};

// Images uploaded in file system not database
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

exports.createUser = factory.createOne(User);
exports.getAllUsers = factory.getAll(User);

// Do not update password with this only for admin users
exports.updateUser = factory.updateOne(User);
exports.getOneUser = factory.getOne(User, 'user');
exports.deleteUser = factory.deleteOne(User, 'user');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

// UPDATE USER DATA
exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file);
  console.log(req.body);

  // 1- Create error if user POSTs password date
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password update! please use /updateMyPassword',
        400
      )
    );
  }

  // 2- Update user document
  const filteredBody = filterObj(req.body, 'name', 'email');
  // Add photo name to database
  if (req.file) filteredBody.photo = req.file.filename;

  const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(201).json({
    status: 'success',
    data: {
      updateUser,
    },
  });
});

// DELETE (DEACTIVE) USER
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    success: true,
    data: {
      user: null,
    },
  });
});

// ME ENDPOINT
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

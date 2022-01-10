const catchAsync = require('../utils/catchAsync');
const { AppError } = require('../utils/appError');
const { APIFeatures } = require('../utils/apiFeatures');

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // Allow nested routes
    if (!req.body.doc) req.body.doc = req.params.tourID;
    if (!req.body.user) req.body.user = req.user.id;

    const newDocument = await Model.create(req.body);

    res.status(200).json({
      status: 'Success',
      data: {
        data: newDocument,
      },
    });
  });

exports.deleteOne = (Model, docName) =>
  catchAsync(async (req, res, next) => {
    const ID = req.params.id;
    const doc = await Model.findByIdAndDelete(ID);

    if (!doc) {
      return next(new AppError(`No ${docName} found with that ID!`, 404));
    }

    res.status(204).json({
      status: 'Success',
      data: {
        doc: null,
      },
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const ID = req.params.id;
    const doc = await Model.findByIdAndUpdate(ID, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID!', 404));
    }

    res.status(200).json({
      status: 'Success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, docName, populateOption) =>
  catchAsync(async (req, res, next) => {
    const ID = req.params.id;
    let query = Model.findById(ID);

    if (populateOption) query = query.populate(populateOption);

    // Data_modeling from doc Model ref : user
    const doc = await query;

    if (!doc) {
      return next(new AppError(`No ${docName} found with that ID!`, 404));
    }

    res.send({
      status: 'Success',
      data: {
        reviews: doc.reviews.length,
        data: doc,
      },
    });
  });

// GET ALL TOURS
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    // Get_One_Review in tours (small hack)
    if (req.params.tourID) filter = { tour: req.params.tourID };

    // EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limit()
      .paginate();

    // const docs = await features.query.explain();
    const docs = await features.query;

    res.status(200).json({
      status: 'Success',
      requestAt: req.requestTime,
      result: docs.length,
      data: {
        data: docs,
      },
    });
  });

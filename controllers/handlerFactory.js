const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    // if tour id isn't found (null)
    if (!doc) {
      return next(new AppError('no document found with ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, //return new doc
      runValidators: true,
    });

    // if tour id isn't found (null)
    if (!doc) {
      return next(new AppError('no doc found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // out of the box, the body isn't on the req, need middleware to add body to the req
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, popOpts) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOpts) query = query.populate(popOpts);
    const doc = await query;

    // if doc id isn't found (null)
    if (!doc) {
      return next(new AppError('no doc found with ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //allow nested GET reviews on tour
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }

    // execute query
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const doc = await features.query.explain();
    const doc = await features.query;

    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });

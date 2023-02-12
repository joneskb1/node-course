const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'review can not be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    // create references to the tour/user
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'must have a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'must have a user'],
    },
  },
  {
    //options
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//each combo of tour and user must be unique
//prevents multi reviews by user on tour
reviewSchema.index(
  { tour: 1, user: 1 },
  {
    unique: true,
  }
);

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// create static method on the model
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // save stats to current tour / set defaults
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

//post doesn't get access to next
reviewSchema.post('save', function () {
  // call the calc after doc is saved
  //this is the doc so to get to the model use constructor
  // send doc's tour field to calc
  this.constructor.calcAverageRatings(this.tour);
});

//for updating and deleting
// can’t calc here due to data not being up to date, need to pass doc to the post
// query function and call calc there
reviewSchema.pre(/^findOneAnd/, async function (next) {
  //this is the query, execute to get the doc and store on the query
  this.r = await this.findOne();
  next();
});

//for updating and deleting
reviewSchema.post(/^findOneAnd/, async function () {
  //this is query and it has already executed
  //access "r" (doc) then its constructor to get the model to calc
  //pass in the doc's tour field
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;

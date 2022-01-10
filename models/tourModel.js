const mongoose = require('mongoose');
const slugify = require('slugify');
const chalk = require('chalk');

// const { User } = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      minlength: [6, 'A tour name must have more or equal then 6 characters.'],
      maxlength: [
        40,
        'A tour name must have less or equal then 40 characters.',
      ],
      // validate: [validator.isAlpha, 'tour name must only contain characters'],
    },
    // SLUGIFY
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      // SHORT_HAND FOR [2,'ERROR']
      enum: {
        values: ['easy', 'medium', 'hard', 'difficult'],
        message: 'Difficulty is either: easy , medium , hard , difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must above 1.0'],
      max: [5, 'Rating must below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      // Custom validator : not work on update query
      validate: {
        validator: function (value) {
          return value < this.price;
        },
        message: 'Discount price ({VALUE}) must be belower then price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      // Name of the image in file system
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    // Three images
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },

    // EMBEDDED OBJECT NOT DOCUMENT
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    // Use this ARRAY
    locations: [
      {
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'user' }],
    // Child-Referencing
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for query speeed performance
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

tourSchema.index({ startLocation: '2dsphere' });

// Virtual Properties : not store in database just for see in request
tourSchema.virtual('duration-weeks').get(function () {
  return this.duration / 7;
});

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// Document Middleware Runs before .save() & .create() Command
// : DOCUMENT MIDDLEWARE
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });

  next();
});

//

// Runs Afer event
// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// });

// BEFORE ANY FIND QUERY EXECUTED : QUERY MIDDLEWARE
// REGULAR EXPRESSION for working every thing started with FIND
// tourSchema.pre('find', function (next) {

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

// Data_Modeling - ref: user
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(
    chalk.yellow(`Query tooks ${Date.now() - this.start} mili seconds.`)
  );
  // console.log(docs);

  next();
});

// AGGRIGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   // This refer to current aggrigate
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = { Tour };

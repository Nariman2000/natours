class APIFeatures {
  constructor(query, reqQuery) {
    this.query = query;
    this.reqQuery = reqQuery;
  }

  filter() {
    // 1 A- FILLTERING
    const queryObj = { ...this.reqQuery };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => {
      delete queryObj[el];
    });

    // 1 B- ADVANCE FILTERING
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // QUERY
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    // 2- SORTING
    if (this.reqQuery.sort) {
      const sortBy = this.reqQuery.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);

      console.log(sortBy);
      // sort('price' 'ratingsAverage');
    } else {
      // Ordered by adding time
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limit() {
    // 3- LIMIT
    if (this.reqQuery.fields) {
      const fields = this.reqQuery.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    // 4- PAGINATION
    const page = this.reqQuery.page * 1 || 1;
    const limit = this.reqQuery.limit * 1 || 100;
    const skip = (page - 1) * limit;

    // page=2,limit=10  1-10 11-20
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = { APIFeatures };

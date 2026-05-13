import ApiError from '../utils/ApiError.js';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Mongo duplicate key (double booking guard)
  if (err.code === 11000) {
    error = new ApiError(409, 'Slot already booked');
  }

  // Mongoose CastError (bad ObjectId)
  if (err.name === 'CastError') {
    error = new ApiError(400, `Invalid ${err.path}: ${err.value}`);
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new ApiError(400, 'Validation failed', messages);
  }

  if (!(error instanceof ApiError)) {
    error = new ApiError(error.statusCode || 500, error.message || 'Server error');
  }

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

export default errorHandler;

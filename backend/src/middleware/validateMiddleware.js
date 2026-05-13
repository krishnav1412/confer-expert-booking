import ApiError from '../utils/ApiError.js';

const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.body = parsed;
    next();
  } catch (err) {
    if (err.errors) {
      const errors = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new ApiError(400, 'Validation failed', errors));
    }
    next(err);
  }
};

export default validate;

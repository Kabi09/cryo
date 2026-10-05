const { validationResult } = require('express-validator');
const { AppError } = require('../utils/apiResponse');

const validate = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorDetails = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return next(new AppError('Input validation failed', 422, 'VALIDATION_ERROR', errorDetails));
  };
};

module.exports = validate;

class ApiResponse {
  static success(res, message = 'Success', data = {}, meta = {}, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      meta
    });
  }

  static created(res, message = 'Created successfully', data = {}, meta = {}) {
    return res.status(201).json({
      success: true,
      message,
      data,
      meta
    });
  }

  static error(res, message = 'An error occurred', statusCode = 500, errorCode = 'INTERNAL_ERROR', errors = []) {
    return res.status(statusCode).json({
      success: false,
      message,
      errorCode,
      errors
    });
  }
}

class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'APP_ERROR', errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  ApiResponse,
  AppError
};

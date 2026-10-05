const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/apiResponse');
const User = require('../models/User');
const ROLES = require('../constants/roles');

const authenticate = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Authentication required. No token provided.', 401, 'UNAUTHORIZED');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretcryotechjwtkeyproductionready2026');
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      throw new AppError('User belonging to this token no longer exists.', 401, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new AppError('This user account has been deactivated.', 403, 'ACCOUNT_DEACTIVATED');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const authorize = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    // ADMIN has full access
    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    if (!requiredPermission) {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    if (!userPermissions.includes(requiredPermission)) {
      return next(new AppError(`Forbidden: Missing required permission [${requiredPermission}]`, 403, 'FORBIDDEN'));
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};

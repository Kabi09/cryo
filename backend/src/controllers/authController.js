const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiResponse, AppError } = require('../utils/apiResponse');
const ROLE_PERMISSIONS = require('../constants/rolePermissions');
const AuditService = require('../services/auditService');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'supersecretcryotechjwtkeyproductionready2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('Email and password are required', 400, 'MISSING_CREDENTIALS');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Account is disabled. Contact your administrator.', 403, 'ACCOUNT_DISABLED');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Refresh permissions from role definition if needed
    if (!user.permissions || user.permissions.length === 0) {
      user.permissions = ROLE_PERMISSIONS[user.role] || [];
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    await AuditService.log({
      entityType: 'USER',
      entityId: user._id,
      action: 'LOGIN',
      actorUserId: user._id,
      actorName: user.name,
      actorRole: user.role,
      reason: 'User logged in successfully',
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    });

    return ApiResponse.success(res, 'Login successful', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        permissions: user.permissions
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = req.user;
    return ApiResponse.success(res, 'Current user profile', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        permissions: user.permissions
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    if (req.user) {
      await AuditService.log({
        entityType: 'USER',
        entityId: req.user._id,
        action: 'LOGOUT',
        actorUserId: req.user._id,
        actorName: req.user.name,
        actorRole: req.user.role,
        reason: 'User logged out'
      });
    }
    return ApiResponse.success(res, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ name: 1 });
    return ApiResponse.success(res, 'Users fetched', { users });
  } catch (err) {
    next(err);
  }
};

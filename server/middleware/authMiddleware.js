import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { verifyAccessToken } from '../services/tokenService.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token required',
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    
    // Attach user to request (excluding password)
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found',
      });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token invalid or expired',
    });
  }
};

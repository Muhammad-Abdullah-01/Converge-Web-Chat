import jwt from 'jsonwebtoken';

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, username: user.username },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

export const sendTokenResponse = (user, statusCode, res) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Parse refresh token duration into milliseconds for cookie expiration
  let maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days default
  const expireStr = process.env.JWT_REFRESH_EXPIRE || '7d';
  const duration = parseInt(expireStr);
  if (!isNaN(duration)) {
    if (expireStr.endsWith('d')) maxAge = duration * 24 * 60 * 60 * 1000;
    else if (expireStr.endsWith('h')) maxAge = duration * 60 * 60 * 1000;
    else if (expireStr.endsWith('m')) maxAge = duration * 60 * 1000;
  }

  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + maxAge),
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  // Also send user object (without password)
  const userData = {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    status: user.status,
  };

  res.status(statusCode).json({
    success: true,
    accessToken,
    user: userData,
  });
};

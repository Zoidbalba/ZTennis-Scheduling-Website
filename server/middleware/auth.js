/**
 * JWT Authentication Middleware
 *
 * Protects routes that require coach authentication.
 * Expects an Authorization header:  Bearer <token>
 *
 * On success the decoded JWT payload is attached to req.coach.
 */

import jwt from 'jsonwebtoken';

/** JWT secret — override via the JWT_SECRET environment variable in production */
const JWT_SECRET = process.env.JWT_SECRET || 'tennis-coach-secret-key-change-in-production';

/**
 * Express middleware that verifies a JWT bearer token.
 *
 * - 401 if no token is provided
 * - 401 if the token is invalid or expired
 * - Attaches decoded payload to req.coach and calls next()
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.coach = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export { JWT_SECRET };

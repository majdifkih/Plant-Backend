import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Request interface to include a user property
export interface CustomRequest extends Request {
  user?: { userId: number; role: string };
}

// Middleware to authenticate JWT tokens
export const authenticateToken = (req: CustomRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Get the token from the Authorization header

  // Check if the token is present
  if (!token) {
    res.status(403).json({ message: 'Token is required' });
    return;
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    // Store user info in the request object for later use
    req.user = decoded as { userId: number; role: string };
    next(); // Proceed to the next middleware or route handler
  });
};

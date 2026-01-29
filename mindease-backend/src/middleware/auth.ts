import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Module augmentation - extends Express Request type globally
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: any;
        username: string | null;
        anonymousName: string | null;
        role: string;
        email: string | null;
        name: string | null;
        fullName: string | null;
        isActive: boolean;
        isVerified: boolean;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Add consistent user data to request with null checks
    req.user = {
      _id: user._id,
      username: user.username || null,
      anonymousName: user.anonymousName || null,
      role: user.role || 'user',
      email: user.email || null,
      name: user.name || null,
      fullName: user.fullName || null,
      isActive: user.isActive !== undefined ? user.isActive : true,
      isVerified: user.isVerified !== undefined ? user.isVerified : false
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const authorizeRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};
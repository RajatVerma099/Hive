import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    displayName?: string | null;
    avatar?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    // Get user from database with retry logic for connection issues
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          displayName: true,
          avatar: true,
          createdAt: true,
          updatedAt: true
        }
      });
    } catch (dbError: any) {
      // If it's a connection error, try to reconnect
      if (dbError.code === 'P1001') {
        console.log('Database connection error, attempting reconnect...');
        // Reconnect by trying the query again after a brief delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            name: true,
            displayName: true,
            avatar: true,
            createdAt: true,
            updatedAt: true
          }
        });
      } else {
        throw dbError;
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
};

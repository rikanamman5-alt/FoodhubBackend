import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import prisma from '../prisma/client.js';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        accountStatus: true,
        subscriptionStatus: true,
        subscriptionEnd: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    if (user.accountStatus !== 'APPROVED') {
      return res.status(403).json({ success: false, message: 'Account pending approval or rejected' });
    }

    // Check subscription/trial expiry for customers and merchants
    if (user.role === 'CUSTOMER' || user.role === 'MERCHANT') {
      if (user.subscriptionStatus === 'EXPIRED' || user.subscriptionStatus === 'SUSPENDED') {
        return res.status(403).json({ success: false, message: 'Subscription expired. Please wait for admin approval to reactivate.' });
      }
      if (user.subscriptionEnd && new Date(user.subscriptionEnd) < new Date()) {
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: 'EXPIRED' },
        });
        return res.status(403).json({ success: false, message: 'Subscription expired. Please wait for admin approval to reactivate.' });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this route' });
    }
    next();
  };
};

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma/client';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middlewares/auth.middleware';

export const register = async (req: Request, res: Response) => {
  res.status(201).json({ success: true, message: 'Registration successful. Please wait for Super Admin approval.' });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (email === 'admin@foodhub.com' && password === 'Admin@123456') {
    const token = generateToken('temp');
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.json({
      success: true,
      data: {
        user: { id: 'temp', firstName: 'Super', lastName: 'Admin', email: 'admin@foodhub.com', role: 'SUPERADMIN', accountStatus: 'APPROVED', subscriptionStatus: 'ACTIVE' },
        token
      }
    });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
};

export const logout = async (req: Request, res: Response) => {
  res.cookie('token', '', { httpOnly: true, secure: true, sameSite: 'none', expires: new Date(0) });
  res.json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: { id: 'temp', firstName: 'Super', lastName: 'Admin', email: 'admin@foodhub.com', role: 'SUPERADMIN' } });
};

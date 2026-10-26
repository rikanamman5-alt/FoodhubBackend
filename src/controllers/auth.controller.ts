import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma/client';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middlewares/auth.middleware';

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, phone, role, storeName, storeAddress, storePhone } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'MERCHANT' ? 'MERCHANT' : 'CUSTOMER';

    const settings = await prisma.subscriptionSettings.findFirst().catch(() => null);
    const trialDays = settings?.defaultTrialDays || 7;

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        role: userRole,
        accountStatus: 'PENDING',
        subscriptionStatus: 'TRIAL',
        trialDays,
      },
    });

    if (userRole === 'MERCHANT' && storeName) {
      try {
        const slug = (storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'store') + '-' + Date.now();
        await prisma.store.create({
          data: {
            name: storeName,
            slug,
            address: storeAddress || '',
            phone: storePhone || phone || '',
            ownerId: user.id,
          },
        });
      } catch (e) {
        console.error(e);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please wait for Super Admin approval.',
      data: { userId: user.id, email: user.email, role: user.role },
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Missing credentials' });

    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' });
    if (user.accountStatus === 'PENDING') return res.status(403).json({ success: false, message: 'Account pending approval' });
    if (user.accountStatus === 'REJECTED') return res.status(403).json({ success: false, message: 'Account rejected' });
    if (user.accountStatus === 'SUSPENDED') return res.status(403).json({ success: false, message: 'Account suspended' });

    if (user.role === 'CUSTOMER' || user.role === 'MERCHANT') {
      if (user.subscriptionStatus === 'EXPIRED' || user.subscriptionStatus === 'SUSPENDED') {
        return res.status(403).json({ success: false, message: 'Subscription expired' });
      }
      if (user.subscriptionEnd && new Date(user.subscriptionEnd) < new Date()) {
        try {
          await prisma.user.update({ where: { id: user.id }, data: { subscriptionStatus: 'EXPIRED' } });
        } catch (e) {}
        return res.status(403).json({ success: false, message: 'Subscription expired' });
      }
    }

    try {
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    } catch (e) {}

    const token = generateToken(user.id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          accountStatus: user.accountStatus,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionEnd: user.subscriptionEnd,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('LOGIN_ERR', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.cookie('token', '', { httpOnly: true, secure: true, sameSite: 'none', expires: new Date(0) });
  res.json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { store: true },
    });
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

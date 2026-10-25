import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, totalMerchants, pendingApprovals, totalOrders, totalStores] = await Promise.all([
      prisma.user.count({ where: { role: { in: ['CUSTOMER', 'MERCHANT'] } } }),
      prisma.user.count({ where: { role: 'MERCHANT' } }),
      prisma.user.count({ where: { accountStatus: 'PENDING' } }),
      prisma.order.count(),
      prisma.store.count(),
    ]);

    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, store: true },
    });

    res.json({ success: true, data: { totalUsers, totalMerchants, pendingApprovals, totalOrders, totalStores, recentOrders } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { not: 'SUPERADMIN' } },
      include: { store: true, approvedBy: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const approveUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const settings = await prisma.subscriptionSettings.findFirst();
    const trialDays = settings?.defaultTrialDays || 7;
    const subscriptionEnd = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

    const user = await prisma.user.update({
      where: { id },
      data: {
        accountStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedById: req.user.id,
        subscriptionStatus: 'TRIAL',
        subscriptionStart: new Date(),
        subscriptionEnd,
        isActive: true,
      },
    });

    await prisma.activityLog.create({
      data: { userId: req.user.id, action: 'APPROVE_USER', details: `Approved user ${user.email}` },
    });

    res.json({ success: true, message: 'User approved with trial subscription', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const rejectUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({ where: { id }, data: { accountStatus: 'REJECTED' } });
    await prisma.activityLog.create({
      data: { userId: req.user.id, action: 'REJECT_USER', details: `Rejected user ${user.email}` },
    });
    res.json({ success: true, message: 'User rejected', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const suspendUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({ where: { id }, data: { accountStatus: 'SUSPENDED', isActive: false } });
    await prisma.activityLog.create({
      data: { userId: req.user.id, action: 'SUSPEND_USER', details: `Suspended user ${user.email}` },
    });
    res.json({ success: true, message: 'User suspended', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const activateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({ where: { id }, data: { accountStatus: 'APPROVED', isActive: true } });
    await prisma.activityLog.create({
      data: { userId: req.user.id, action: 'ACTIVATE_USER', details: `Activated user ${user.email}` },
    });
    res.json({ success: true, message: 'User activated', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const extendSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { days } = req.body;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const currentEnd = user.subscriptionEnd ? new Date(user.subscriptionEnd) : new Date();
    const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);

    const updated = await prisma.user.update({
      where: { id },
      data: { subscriptionStatus: 'ACTIVE', subscriptionEnd: newEnd },
    });

    await prisma.activityLog.create({
      data: { userId: req.user.id, action: 'EXTEND_SUBSCRIPTION', details: `Extended ${user.email} subscription by ${days} days` },
    });

    res.json({ success: true, message: `Subscription extended by ${days} days`, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateSuperAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const data: any = { firstName, lastName, email };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    const user = await prisma.user.update({ where: { id: req.user.id }, data });
    res.json({ success: true, message: 'Super Admin account updated', data: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: { customer: true, store: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    const [subscription, site, payment] = await Promise.all([
      prisma.subscriptionSettings.findFirst(),
      prisma.siteSettings.findFirst(),
      prisma.paymentSettings.findFirst(),
    ]);
    res.json({ success: true, data: { subscription, site, payment } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateSubscriptionSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { defaultTrialDays } = req.body;
    let settings = await prisma.subscriptionSettings.findFirst();
    if (!settings) {
      settings = await prisma.subscriptionSettings.create({ data: { defaultTrialDays } });
    } else {
      settings = await prisma.subscriptionSettings.update({ where: { id: settings.id }, data: { defaultTrialDays, updatedById: req.user.id } });
    }
    res.json({ success: true, message: 'Subscription settings updated', data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updatePaymentSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { gcashName, gcashNumber, gcashQrImage } = req.body;
    let settings = await prisma.paymentSettings.findFirst();
    if (!settings) {
      settings = await prisma.paymentSettings.create({ data: { gcashName, gcashNumber, gcashQrImage } });
    } else {
      settings = await prisma.paymentSettings.update({ where: { id: settings.id }, data: { gcashName, gcashNumber, gcashQrImage, updatedById: req.user.id } });
    }
    res.json({ success: true, message: 'Payment settings updated', data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getActivityLogs = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.activityLog.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' }, take: 100 });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

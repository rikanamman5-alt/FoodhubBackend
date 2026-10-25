import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  approveUser,
  rejectUser,
  suspendUser,
  activateUser,
  extendSubscription,
  updateSuperAdmin,
  getAllOrders,
  getSettings,
  updateSubscriptionSettings,
  updatePaymentSettings,
  getActivityLogs,
} from '../controllers/superadmin.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect, authorize('SUPERADMIN'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/approve', approveUser);
router.put('/users/:id/reject', rejectUser);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/activate', activateUser);
router.put('/users/:id/extend', extendSubscription);
router.put('/me', updateSuperAdmin);
router.get('/orders', getAllOrders);
router.get('/settings', getSettings);
router.put('/settings/subscription', updateSubscriptionSettings);
router.put('/settings/payment', updatePaymentSettings);
router.get('/activity-logs', getActivityLogs);

export default router;

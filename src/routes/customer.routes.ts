import express from 'express';
import { getStores, getStoreProducts, createOrder, getMyOrders, getPaymentSettings } from '../controllers/customer.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect, authorize('CUSTOMER'));

router.get('/stores', getStores);
router.get('/stores/:slug', getStoreProducts);
router.post('/orders', createOrder);
router.get('/orders', getMyOrders);
router.get('/payment-settings', getPaymentSettings);

export default router;

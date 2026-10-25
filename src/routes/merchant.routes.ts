import express from 'express';
import { getMyStore, createCategory, createProduct, getStoreOrders, updateOrderStatus } from '../controllers/merchant.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect, authorize('MERCHANT'));

router.get('/store', getMyStore);
router.post('/categories', createCategory);
router.post('/products', createProduct);
router.get('/orders', getStoreOrders);
router.put('/orders/:id/status', updateOrderStatus);

export default router;

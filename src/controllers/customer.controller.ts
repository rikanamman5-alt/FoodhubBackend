import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getStores = async (req: AuthRequest, res: Response) => {
  try {
    const stores = await prisma.store.findMany({ where: { isActive: true, isOpen: true }, include: { products: { where: { isAvailable: true } } } });
    res.json({ success: true, data: stores });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getStoreProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const store = await prisma.store.findUnique({ where: { slug }, include: { categories: { include: { products: { where: { isAvailable: true } } } } } });
    res.json({ success: true, data: store });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { storeId, items, paymentMethod, deliveryAddress, deliveryPhone, notes, gcashRefNumber, gcashProofImage } = req.body;

    let subtotal = 0;
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      subtotal += Number(product.price) * item.quantity;
    }

    const deliveryFee = 0;
    const total = subtotal + deliveryFee;
    const orderNumber = `FH-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: req.user.id,
        storeId,
        subtotal,
        deliveryFee,
        total,
        paymentMethod,
        paymentStatus: paymentMethod === 'GCASH' ? 'PENDING' : 'PENDING',
        deliveryAddress,
        deliveryPhone,
        notes,
        gcashRefNumber,
        gcashProofImage,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { customerId: req.user.id },
      include: { store: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getPaymentSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.paymentSettings.findFirst();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

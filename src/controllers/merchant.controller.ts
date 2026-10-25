import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getMyStore = async (req: AuthRequest, res: Response) => {
  try {
    const store = await prisma.store.findUnique({ where: { ownerId: req.user.id }, include: { categories: true, products: true } });
    res.json({ success: true, data: store });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    const store = await prisma.store.findUnique({ where: { ownerId: req.user.id } });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const category = await prisma.category.create({ data: { name, slug, storeId: store.id } });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, price, categoryId, image } = req.body;
    const store = await prisma.store.findUnique({ where: { ownerId: req.user.id } });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const product = await prisma.product.create({
      data: { name, slug, description, price: parseFloat(price), categoryId, storeId: store.id, image },
    });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getStoreOrders = async (req: AuthRequest, res: Response) => {
  try {
    const store = await prisma.store.findUnique({ where: { ownerId: req.user.id } });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    const orders = await prisma.order.findMany({
      where: { storeId: store.id },
      include: { customer: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const store = await prisma.store.findUnique({ where: { ownerId: req.user.id } });
    const order = await prisma.order.findFirst({ where: { id, storeId: store?.id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const updateData: any = { status };
    if (status === 'CONFIRMED') updateData.confirmedAt = new Date();
    if (status === 'PREPARING') updateData.preparingAt = new Date();
    if (status === 'OUT_FOR_DELIVERY') updateData.outForDeliveryAt = new Date();
    if (status === 'DELIVERED') updateData.deliveredAt = new Date();
    if (status === 'CANCELLED') updateData.cancelledAt = new Date();

    const updated = await prisma.order.update({ where: { id }, data: updateData });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

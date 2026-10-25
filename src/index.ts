import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes.ts';
import superadminRoutes from './routes/superadmin.routes.js';
import merchantRoutes from './routes/merchant.routes.js';
import customerRoutes from './routes/customer.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.json({ message: 'Foodhub API is running', version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/customer', customerRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import uploadRoutes from './routes/upload.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/upload', uploadRoutes);

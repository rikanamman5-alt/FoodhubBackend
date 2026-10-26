import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: '*',
  credentials: false,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
  res.send('FoodHub API is running! 🍽️');
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (email === 'admin@foodhub.com' && password === 'Admin@123456') {
    return res.json({ success: true, data: { user: { id: '1', firstName: 'Super', lastName: 'Admin', email: 'admin@foodhub.com', role: 'SUPERADMIN', accountStatus: 'APPROVED', subscriptionStatus: 'ACTIVE' }, token: 'test' } });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

app.post('/api/auth/register', (req, res) => {
  return res.status(201).json({ success: true, message: 'Registration successful. Please wait for Super Admin approval.' });
});

app.get('/api/auth/me', (req, res) => {
  return res.json({ success: true, data: { id: '1', firstName: 'Super', lastName: 'Admin', email: 'admin@foodhub.com', role: 'SUPERADMIN' } });
});

app.listen(process.env.PORT || 5000, '0.0.0.0', () => {
  console.log('Server running');
});

export default app;

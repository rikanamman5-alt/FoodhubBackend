import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('FoodHub API is running! 🍽️');
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (String(email) === 'admin@foodhub.com' && String(password) === 'Admin@123456') {
    return res.json({ success: true, data: { user: { id: '1', firstName: 'Super', lastName: 'Admin', email: 'admin@foodhub.com', role: 'SUPERADMIN', accountStatus: 'APPROVED', subscriptionStatus: 'ACTIVE' }, token: 'test' } });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

app.post('/api/auth/register', (req, res) => {
  return res.status(201).json({ success: true, message: 'Registration successful. Please wait for Super Admin approval.', data: { userId: '1', email: req.body?.email, role: 'CUSTOMER' } });
});

app.get('/api/auth/me', (req, res) => {
  return res.json({ success: true, data: { id: '1', firstName: 'Super', lastName: 'Admin', email: 'admin@foodhub.com', role: 'SUPERADMIN' } });
});

app.listen(process.env.PORT || 5000, '0.0.0.0', () => {
  console.log('Server running');
});

export default app;

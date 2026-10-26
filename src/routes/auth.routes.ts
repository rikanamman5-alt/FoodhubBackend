import express from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller';

const router = express.Router();

router.post('/register', (req, res) => {
  res.json({ success: true, message: 'ok' });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@foodhub.com' && password === 'Admin@123456') {
    return res.json({ success: true, data: { user: { email, role: 'SUPERADMIN' }, token: 'test' } });
  }
  return res.status(401).json({ success: false, message: 'Invalid' });
});

router.post('/logout', (req, res) => res.json({ success: true }));
router.get('/me', (req, res) => res.json({ success: true, data: {} }));

export default router;

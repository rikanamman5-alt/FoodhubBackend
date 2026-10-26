import express from 'express';

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/', (req, res) => res.send('FoodHub API is running! 🍽️'));
app.post('/api/auth/login', (req, res) => {
  const email = req.body && req.body.email;
  const password = req.body && req.body.password;
  if (email === 'admin@foodhub.com' && password === 'Admin@123456') {
    return res.json({ success: true, data: { user: { role: 'SUPERADMIN', email: 'admin@foodhub.com', firstName: 'Super', lastName: 'Admin', accountStatus: 'APPROVED', subscriptionStatus: 'ACTIVE' }, token: 'test' } });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

app.listen(process.env.PORT || 5000, '0.0.0.0', () => console.log('up'));

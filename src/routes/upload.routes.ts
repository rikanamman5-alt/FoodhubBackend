import express from 'express';
import { upload } from '../middlewares/upload.middleware';
import { protect } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, data: { url: fileUrl } });
});

export default router;

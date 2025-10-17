import { Router } from "express";
import multer from "multer";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate unique filename
    const ext = req.file.originalname.split('.').pop();
    const filename = `${nanoid()}.${ext}`;
    const key = `uploads/${filename}`;

    // Upload to S3
    const result = await storagePut(
      key,
      req.file.buffer,
      req.file.mimetype
    );

    res.json({
      url: result.url,
      key: result.key,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;


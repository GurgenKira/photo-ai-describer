import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables first
dotenv.config();

// Validate environment variables
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ ERROR: GEMINI_API_KEY is not set in .env file');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// File upload configuration with security limits
const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 20 * 1024 * 1024, // 20MB limit
    files: 1 // Only allow 1 file per request
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Photo AI Describer API is running' });
});

app.post('/api/describe', upload.single('image'), async (req, res) => {
  try {
    console.log('Received image upload request');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No image uploaded' 
      });
    }

    // Read image file
    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Use Gemini to describe the image
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const result = await model.generateContent([
      "Provide a brief, concise description of this image in 2-3 sentences. Focus on the main subject, key objects, and overall scene. Keep it simple and clear.",
      {
        inlineData: {
          mimeType: req.file.mimetype,
          data: base64Image
        }
      }
    ]);

    const description = result.response.text();

    // Clean up: Delete the uploaded file after processing (security best practice)
    try {
      fs.unlinkSync(imagePath);
    } catch (err) {
      console.error('Error deleting file:', err);
    }

    res.json({
      success: true,
      description: description,
      filename: req.file.filename
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false,
        error: 'File too large. Maximum size is 20MB. Please use a smaller image.' 
      });
    }
  }
  
  res.status(500).json({ 
    success: false,
    error: error.message 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

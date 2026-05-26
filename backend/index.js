import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables first
dotenv.config();

// Validate environment variables
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ ERROR: GEMINI_API_KEY is not set in .env file');
  process.exit(1);
}

if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
  console.error('❌ ERROR: AZURE_STORAGE_CONNECTION_STRING is not set in .env file');
  process.exit(1);
}

if (!process.env.AZURE_STORAGE_CONTAINER_NAME) {
  console.error('❌ ERROR: AZURE_STORAGE_CONTAINER_NAME is not set in .env file');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME);

// Middleware
app.use(cors());
app.use(express.json());

// File upload configuration with security limits
const upload = multer({ 
  storage: multer.memoryStorage(),
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

async function ensureContainerExists() {
  const createResult = await containerClient.createIfNotExists({
    access: 'blob'
  });

  if (createResult.succeeded) {
    console.log(`✅ Created Azure blob container: ${process.env.AZURE_STORAGE_CONTAINER_NAME}`);
  }
}

app.post('/api/describe', upload.single('image'), async (req, res) => {
  try {
    console.log('Received image upload request');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No image uploaded' 
      });
    }

    const fileExtension = req.file.originalname?.split('.').pop() || 'jpg';
    const blobName = `${Date.now()}-${uuidv4()}.${fileExtension}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype }
    });

    const base64Image = req.file.buffer.toString('base64');

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

    res.json({
      success: true,
      description: description,
      filename: blobName,
      imageUrl: blockBlobClient.url
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
ensureContainerExists()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to initialize Azure blob container:', error.message);
    process.exit(1);
  });

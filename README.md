# Photo AI Describer

An AI-powered mobile application that analyzes and describes images using Google's Gemini AI. Built with React Native (Expo) for the frontend and Node.js/Express for the backend.

## Features

- 📷 **Pick images from gallery** or take photos with camera
- 🤖 **AI-powered image analysis** using Google Gemini 2.5 Flash
- 📝 **Concise descriptions** - Brief, clear summaries (2-3 sentences)
- 📜 **History feature** - Saves last 20 analyzed images
- 🎨 **Beautiful modern UI** - Gradient header, card-based design
- ⚡ **Real-time processing** with loading indicators
- 📱 **Cross-platform** mobile support (iOS & Android)
- 🗑️ **Clear history** option

## Tech Stack

### Frontend
- **React Native** with Expo
- **Expo Router** for navigation
- **Expo Image Picker** for image selection and camera
- **AsyncStorage** for persistent history
- **TypeScript**

### Backend
- **Node.js** with Express
- **Multer** for file upload handling
- **Google Generative AI SDK** (Gemini 2.5 Flash)
- **CORS** enabled for cross-origin requests

## Project Structure

```
photo-ai-describer/
├── frontend/
│   └── photo-ai-frontend/
│       └── app/
│           └── index.tsx          # Main app screen
├── backend/
│   ├── index.js                   # Express server
│   ├── package.json
│   ├── .env                       # Environment variables
│   └── uploads/                   # Uploaded images storage
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your configuration:
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Start the backend server:
```bash
npm start
```

The server will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend/photo-ai-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Update the API URL in `app/index.tsx`:
   - Replace `192.168.27.4` with your machine's local IP address
   - Find your IP: `hostname -I | awk '{print $1}'` (Linux) or `ipconfig getifaddr en0` (Mac)

4. Start the Expo development server:
```bash
npx expo start
```

5. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

## API Endpoints

### GET `/`
Health check endpoint
```json
{
  "message": "Photo AI Describer API is running"
}
```

### POST `/api/describe`
Upload and analyze an image

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `image` (file)

**Response:**
```json
{
  "success": true,
  "description": "A detailed description of the image...",
  "filename": "1234567890-photo.jpg"
}
```

## Configuration

### Backend Configuration
- **Port**: Default 3000 (configurable via `.env`)
- **File Upload Limit**: 20MB
- **Gemini Model**: `gemini-2.5-flash`

### Frontend Configuration
- **API URL**: Update in `app/index.tsx` (search for fetch URL)
- **Image Quality**: 0.5 (optimized for size)
- **Image Editing**: Enabled with 4:3 aspect ratio
- **Media Type**: Images only

## Development Notes

### Network Configuration
- Backend must be accessible from your mobile device
- Use your machine's local IP address (not `localhost`)
- Ensure both devices are on the same network
- Check firewall settings if connection fails

### Gemini API Models
Current model: `gemini-2.5-flash`

If you encounter model errors, try these alternatives:
- `gemini-3-flash-preview`
- `gemini-2.5-pro`

## Troubleshooting

### "Connection refused" error
- Verify backend is running: `curl http://localhost:3000`
- Check if port 3000 is available: `lsof -i:3000`
- Update frontend IP address to match your machine

### "Model not found" error
- Verify your Gemini API key is valid
- Check if the model name is correct
- Try alternative model names

### Image upload fails
- Check file size (max 20MB)
- Images are automatically compressed to 50% quality
- Use the crop/edit feature to reduce size further
- Verify image format (JPEG, PNG)
- Check backend logs for detailed errors

## Recent Updates (v2.0)

- ✅ Camera capture functionality
- ✅ Image history with saved descriptions (last 20)
- ✅ Modern, beautiful UI with gradient design
- ✅ Concise AI descriptions (2-3 sentences)
- ✅ Clear history option

## Future Enhancements

- [ ] Multiple language support
- [ ] Different analysis modes (brief, detailed, creative)
- [ ] Share functionality
- [ ] Export history as PDF/text
- [ ] Image editing before analysis
- [ ] Dark mode support
- [ ] Search within history

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on the repository.

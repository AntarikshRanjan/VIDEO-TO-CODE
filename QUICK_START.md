# Quick Start Guide

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env.local`
   - Add your API keys (optional for development with mock data)

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## First Steps

1. **Upload a video**: Drag and drop or click to upload an MP4 video file
2. **Wait for processing**: The app will extract frames automatically
3. **Review components**: AI-detected components will be displayed
4. **Answer questions**: Complete the questionnaire about functionality
5. **Generate code**: AI will generate HTML, CSS, and JavaScript
6. **Export**: Download the complete website as a ZIP file

## Development Mode

The app works without API keys using mock data:
- Mock components are returned if Gemini API is not configured
- Template website is generated if Hugging Face API is not configured

## Troubleshooting

### FFmpeg Loading Issues
- Ensure you have a stable internet connection (FFmpeg.wasm loads from CDN)
- Try refreshing the page if FFmpeg fails to load

### Video Processing Issues
- Use MP4 format for best compatibility
- Keep video files under 100MB
- Processing happens client-side, so large videos may take time

### API Errors
- Check your API keys in `.env.local`
- Verify API quotas and limits
- The app will fall back to mock data if APIs fail

## Next Steps

- Customize the generated code
- Add more component types
- Enhance AI prompts for better results
- Integrate additional frameworks (React, Vue, etc.)


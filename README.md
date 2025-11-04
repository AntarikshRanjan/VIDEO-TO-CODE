# Video to Code - AI-Powered Website Generator

Transform website videos into functional code using AI. This Next.js 14 application processes videos locally, extracts frames, analyzes them with Google Gemini Vision, and generates working HTML/CSS/JS code.

## Features

- 🎬 **Video Upload**: Drag-and-drop interface for MP4 video files
- 🖼️ **Frame Extraction**: Client-side frame extraction using FFmpeg.wasm (1 frame per 2 seconds)
- 🤖 **AI Analysis**: Component detection using Google Gemini Vision API
- ❓ **Interactive Questionnaire**: Dynamic questions based on detected components
- ⚡ **Code Generation**: Generate functional HTML/CSS/JS using Hugging Face CodeLlama
- 📦 **ZIP Export**: Download complete website as a ZIP file

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Video Processing**: FFmpeg.wasm (client-side)
- **AI APIs**: 
  - Google Gemini Vision (component detection)
  - Hugging Face CodeLlama (code generation)
- **State Management**: React Context API
- **File Export**: JSZip

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Google Gemini API key (for component detection)
- Hugging Face token (for code generation)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
# or
yarn install
```

2. Create a `.env.local` file in the root directory:

```env
GOOGLE_AI_API_KEY=your_gemini_api_key_here
HUGGING_FACE_TOKEN=your_huggingface_token_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Upload Video**: Drag and drop or click to upload a video file (MP4, max 100MB)
2. **Frame Extraction**: The app automatically extracts frames (1 per 2 seconds)
3. **AI Analysis**: Detected components are displayed with confidence scores
4. **Answer Questions**: Complete the interactive questionnaire about component functionality
5. **Generate Code**: AI generates HTML, CSS, and JavaScript files
6. **Export**: Download the complete website as a ZIP file

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── gemini/route.ts    # Gemini Vision API endpoint
│   │   └── code/route.ts       # Code generation API endpoint
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Main application page
│   └── globals.css             # Global styles
├── components/
│   ├── VideoUpload.tsx         # Video upload component
│   ├── FrameExtractor.tsx      # FFmpeg frame extraction
│   ├── ComponentDetector.tsx   # AI component detection display
│   ├── Questionnaire.tsx       # Interactive form
│   ├── CodeGenerator.tsx       # Code preview and export
│   └── ProgressStepper.tsx     # Pipeline progress indicator
├── contexts/
│   └── AppContext.tsx          # Global state management
├── types/
│   └── index.ts                # TypeScript interfaces
├── utils/
│   ├── ffmpeg.ts               # FFmpeg utilities
│   ├── ai.ts                   # AI API handlers
│   └── export.ts               # ZIP file generation
└── styles/
    └── globals.css             # Tailwind CSS styles
```

## API Keys Setup

### Google Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local` file as `GOOGLE_AI_API_KEY`

### Hugging Face Token

1. Go to [Hugging Face](https://huggingface.co/settings/tokens)
2. Create a new access token
3. Add it to your `.env.local` file as `HUGGING_FACE_TOKEN`

**Note**: The app includes mock data fallbacks for development, so you can test the pipeline without API keys.

## Development Mode

The app includes mock data generation for development:
- Component detection returns sample components if Gemini API is not configured
- Code generation returns a template website if Hugging Face API is not configured

## Building for Production

```bash
npm run build
npm start
```

## Limitations

- Video processing happens client-side, so large videos may take time
- Frame extraction is limited to 1 frame per 2 seconds
- AI analysis is limited to the first 5 frames to avoid token limits
- Generated code is a starting point and may require manual refinement

## Future Enhancements

- [ ] Server-side video processing option
- [ ] More granular frame extraction controls
- [ ] Enhanced AI prompt engineering
- [ ] Code quality validation
- [ ] Multiple framework support (React, Vue, etc.)
- [ ] Real-time preview of generated website

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


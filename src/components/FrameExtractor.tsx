'use client';

import { useContext, useEffect, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { extractFrames } from '@/utils/ffmpeg';

export default function FrameExtractor() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('FrameExtractor must be used within AppProvider');
  }
  const { state, setFrames, setStep, setExtractionProgress, setError, setLoading } = context;
  const [isExtracting, setIsExtracting] = useState(false);
  const [isLoadingFFmpeg, setIsLoadingFFmpeg] = useState(false);

  useEffect(() => {
    if (state.videoFile && state.frames.length === 0 && !isExtracting) {
      extractFramesFromVideo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.videoFile]);

  const extractFramesFromVideo = async () => {
    if (!state.videoFile) return;

    setIsExtracting(true);
    setLoading(true);
    setIsLoadingFFmpeg(true);
    setError(null);

    try {
      // First, try to load FFmpeg (this will attempt multiple methods)
      const frames = await extractFrames(state.videoFile, (progress) => {
        setExtractionProgress(progress);
        if (progress > 0) {
          setIsLoadingFFmpeg(false); // FFmpeg loaded, now extracting
        }
      });

      setFrames(frames);
      setStep('analysis');
    } catch (error: any) {
      console.error('Frame extraction error:', error);
      
      // Provide more helpful error messages
      let errorMessage = error.message || 'Failed to extract frames from video';
      
      if (errorMessage.includes('Failed to initialize FFmpeg') || errorMessage.includes('FFmpeg extraction failed')) {
        // The app will automatically fall back to Canvas API, but let the user know
        errorMessage = `FFmpeg failed to load, but the app will automatically use Canvas API as a fallback.\n\n` +
          `If this message appears, it means both methods failed. Please check:\n` +
          `- Your video file is valid and in a supported format (MP4, WebM)\n` +
          `- Browser console for detailed error messages\n` +
          `- Try refreshing the page\n\n` +
          `Note: The app will automatically try Canvas API if FFmpeg fails.`;
      }
      
      setError(errorMessage);
    } finally {
      setIsExtracting(false);
      setLoading(false);
      setIsLoadingFFmpeg(false);
    }
  };

  if (!state.videoFile) {
    return (
      <div className="card max-w-4xl mx-auto text-center">
        <p className="text-gray-600">No video file selected</p>
      </div>
    );
  }

  return (
    <div className="card max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Extracting Frames</h2>
      
      {isLoadingFFmpeg && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Loading FFmpeg...</strong> This may take a few moments. The app is trying multiple CDN sources to load FFmpeg.
          </p>
        </div>
      )}
      
      <p className="text-gray-600 text-center mb-6">
        {isLoadingFFmpeg ? 'Initializing video processor...' : 'Processing your video... This may take a moment.'}
      </p>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {isLoadingFFmpeg ? 'Loading FFmpeg' : 'Progress'}
          </span>
          <span className="text-sm text-gray-600">
            {isLoadingFFmpeg ? 'Please wait...' : `${Math.round(state.extractionProgress)}%`}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              isLoadingFFmpeg ? 'bg-blue-500 animate-pulse' : 'bg-primary-600'
            }`}
            style={{ 
              width: isLoadingFFmpeg ? '50%' : `${state.extractionProgress}%` 
            }}
          />
        </div>
      </div>
      
      {state.error && (
        <div className="mb-4">
          <button
            onClick={extractFramesFromVideo}
            className="btn-primary w-full"
          >
            Retry Frame Extraction
          </button>
        </div>
      )}

      {state.videoUrl && (
        <div className="mt-6">
          <video
            src={state.videoUrl}
            controls
            className="w-full rounded-lg max-h-96"
          />
        </div>
      )}

      {state.frames.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">
            Extracted Frames ({state.frames.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {state.frames.map((frame: string, index: number) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <img
                  src={frame}
                  alt={`Frame ${index + 1}`}
                  className="w-full h-auto"
                />
                <p className="text-xs text-center py-1 text-gray-600">
                  Frame {index + 1}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


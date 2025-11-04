'use client';

import { useContext, useRef, useState, useCallback } from 'react';
import { AppContext } from '@/contexts/AppContext';

export default function VideoUpload() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('VideoUpload must be used within AppProvider');
  }
  const { setVideoFile, setVideoUrl, setStep, setError } = context;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback(
    (file: File) => {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file');
        return;
      }

      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setError('Video file is too large. Maximum size is 100MB');
        return;
      }

      setError(null);
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setStep('processing');
    },
    [setVideoFile, setVideoUrl, setStep, setError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="card max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Upload Your Video</h2>
      <p className="text-gray-600 text-center mb-6">
        Drag and drop a video file or click to browse
      </p>

      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center">
          <div className="text-6xl mb-4">📹</div>
          <p className="text-lg font-semibold text-gray-700 mb-2">
            {isDragging ? 'Drop your video here' : 'Click or drag to upload'}
          </p>
          <p className="text-sm text-gray-500">
            Supported formats: MP4, WebM, MOV (Max 100MB)
          </p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Your video will be processed locally in your browser. No files are sent to our servers.
        </p>
      </div>
    </div>
  );
}


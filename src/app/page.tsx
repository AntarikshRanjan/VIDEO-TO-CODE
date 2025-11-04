'use client';

import { useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';
import ProgressStepper from '@/components/ProgressStepper';
import VideoUpload from '@/components/VideoUpload';
import FrameExtractor from '@/components/FrameExtractor';
import ComponentDetector from '@/components/ComponentDetector';
import Questionnaire from '@/components/Questionnaire';
import CodeGenerator from '@/components/CodeGenerator';

export default function Home() {
  const { state } = useContext(AppContext);

  const renderStepContent = () => {
    switch (state.currentStep) {
      case 'upload':
        return <VideoUpload />;
      case 'processing':
        return <FrameExtractor />;
      case 'analysis':
        return <ComponentDetector />;
      case 'questions':
        return <Questionnaire />;
      case 'generation':
        return <CodeGenerator />;
      case 'export':
        return <CodeGenerator />;
      default:
        return <VideoUpload />;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Video to Code
          </h1>
          <p className="text-gray-600 text-lg">
            Transform website videos into functional code with AI
          </p>
        </header>

        <ProgressStepper />

        <div className="mt-8">
          {state.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <p className="font-semibold">Error: {state.error}</p>
            </div>
          )}

          {state.loading && (
            <div className="mb-6 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Processing...</span>
            </div>
          )}

          {renderStepContent()}
        </div>
      </div>
    </main>
  );
}


'use client';

import { useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { PipelineStep } from '@/types';

const steps: { key: PipelineStep; label: string; icon: string }[] = [
  { key: 'upload', label: 'Upload Video', icon: '📤' },
  { key: 'processing', label: 'Extract Frames', icon: '🎬' },
  { key: 'analysis', label: 'AI Analysis', icon: '🔍' },
  { key: 'questions', label: 'Questions', icon: '❓' },
  { key: 'generation', label: 'Generate Code', icon: '⚡' },
  { key: 'export', label: 'Export', icon: '📦' },
];

export default function ProgressStepper() {
  const { state } = useContext(AppContext);

  const getCurrentStepIndex = () => {
    return steps.findIndex((step) => step.key === state.currentStep);
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-primary-600 text-white scale-110 shadow-lg'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? '✓' : step.icon}
                </div>
                <p
                  className={`mt-2 text-sm font-medium text-center ${
                    isActive
                      ? 'text-primary-600'
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-all duration-300 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


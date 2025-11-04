'use client';

import { useContext, useEffect } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { DetectedComponent } from '@/types';

export default function ComponentDetector() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('ComponentDetector must be used within AppProvider');
  }
  const { state, setDetectedComponents, setStep, setLoading, setError } = context;

  useEffect(() => {
    if (state.frames.length > 0 && state.detectedComponents.length === 0) {
      analyzeFrames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.frames]);

  const analyzeFrames = async () => {
    if (state.frames.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ frames: state.frames }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to analyze frames: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.components || data.components.length === 0) {
        throw new Error('No components detected. Please try with a different video or check the video quality.');
      }
      
      setDetectedComponents(data.components);
      setStep('questions');
    } catch (error: any) {
      console.error('Analysis error:', error);
      setError(error.message || 'Failed to analyze video frames');
    } finally {
      setLoading(false);
    }
  };

  const getComponentIcon = (type: DetectedComponent['type']) => {
    const icons: Record<string, string> = {
      button: '🔘',
      input: '📝',
      form: '📋',
      navigation: '🧭',
      card: '🃏',
      modal: '🪟',
      slider: '🎚️',
      other: '📦',
    };
    return icons[type] || icons.other;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (state.detectedComponents.length === 0 && !state.loading) {
    return (
      <div className="card max-w-4xl mx-auto text-center">
        <p className="text-gray-600">No components detected yet. Analyzing frames...</p>
      </div>
    );
  }

  return (
    <div className="card max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Detected Components</h2>
      <p className="text-gray-600 text-center mb-6">
        AI has identified the following components in your video
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.detectedComponents.map((component: DetectedComponent) => (
          <div
            key={component.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getComponentIcon(component.type)}</span>
                <div>
                  <h3 className="font-semibold text-lg">{component.label}</h3>
                  <p className="text-sm text-gray-500 capitalize">{component.type}</p>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${getConfidenceColor(
                  component.confidence
                )}`}
              >
                {Math.round(component.confidence * 100)}%
              </span>
            </div>
            <p className="text-sm text-gray-600">{component.description}</p>
          </div>
        ))}
      </div>

      {state.frames.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Reference Frames</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {state.frames.slice(0, 4).map((frame: string, index: number) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <img
                  src={frame}
                  alt={`Reference frame ${index + 1}`}
                  className="w-full h-auto"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


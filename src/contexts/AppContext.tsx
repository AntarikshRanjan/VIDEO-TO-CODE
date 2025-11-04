'use client';

import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { AppState, PipelineStep, DetectedComponent, FileStructure } from '@/types';

interface AppContextType {
  state: AppState;
  setStep: (step: PipelineStep) => void;
  setVideoFile: (file: File | null) => void;
  setVideoUrl: (url: string | null) => void;
  setFrames: (frames: string[]) => void;
  setDetectedComponents: (components: DetectedComponent[]) => void;
  setUserResponses: (responses: Record<string, string>) => void;
  updateUserResponse: (key: string, value: string) => void;
  setGeneratedCode: (code: string) => void;
  setGeneratedFiles: (files: FileStructure[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setExtractionProgress: (progress: number) => void;
  reset: () => void;
}

const initialState: AppState = {
  currentStep: 'upload',
  videoFile: null,
  videoUrl: null,
  frames: [],
  detectedComponents: [],
  userResponses: {},
  generatedCode: '',
  generatedFiles: [],
  loading: false,
  error: null,
  extractionProgress: 0,
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const setStep = useCallback((step: PipelineStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const setVideoFile = useCallback((file: File | null) => {
    setState((prev) => ({ ...prev, videoFile: file }));
  }, []);

  const setVideoUrl = useCallback((url: string | null) => {
    setState((prev) => ({ ...prev, videoUrl: url }));
  }, []);

  const setFrames = useCallback((frames: string[]) => {
    setState((prev) => ({ ...prev, frames }));
  }, []);

  const setDetectedComponents = useCallback((components: DetectedComponent[]) => {
    setState((prev) => ({ ...prev, detectedComponents: components }));
  }, []);

  const setUserResponses = useCallback((responses: Record<string, string>) => {
    setState((prev) => ({ ...prev, userResponses: responses }));
  }, []);

  const updateUserResponse = useCallback((key: string, value: string) => {
    setState((prev) => ({
      ...prev,
      userResponses: { ...prev.userResponses, [key]: value },
    }));
  }, []);

  const setGeneratedCode = useCallback((code: string) => {
    setState((prev) => ({ ...prev, generatedCode: code }));
  }, []);

  const setGeneratedFiles = useCallback((files: FileStructure[]) => {
    setState((prev) => ({ ...prev, generatedFiles: files }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const setExtractionProgress = useCallback((progress: number) => {
    setState((prev) => ({ ...prev, extractionProgress: progress }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const value: AppContextType = {
    state,
    setStep,
    setVideoFile,
    setVideoUrl,
    setFrames,
    setDetectedComponents,
    setUserResponses,
    updateUserResponse,
    setGeneratedCode,
    setGeneratedFiles,
    setLoading,
    setError,
    setExtractionProgress,
    reset,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}


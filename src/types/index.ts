export type PipelineStep = 'upload' | 'processing' | 'analysis' | 'questions' | 'generation' | 'export';

export interface DetectedComponent {
  id: string;
  type: 'button' | 'input' | 'form' | 'navigation' | 'card' | 'modal' | 'slider' | 'other';
  label: string;
  description: string;
  confidence: number;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  frameIndex?: number;
}

export interface AppState {
  currentStep: PipelineStep;
  videoFile: File | null;
  videoUrl: string | null;
  frames: string[];
  detectedComponents: DetectedComponent[];
  userResponses: Record<string, string>;
  generatedCode: string;
  generatedFiles: FileStructure[];
  loading: boolean;
  error: string | null;
  extractionProgress: number;
}

export interface FileStructure {
  path: string;
  content: string;
  type: 'html' | 'css' | 'js' | 'json' | 'other';
}

export interface QuestionnaireQuestion {
  id: string;
  componentId: string;
  question: string;
  type: 'text' | 'select' | 'checkbox' | 'radio';
  options?: string[];
  required: boolean;
}


'use client';

import { useContext, useEffect, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { generateZipFile, downloadBlob } from '@/utils/export';
import { FileStructure } from '@/types';

export default function CodeGenerator() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('CodeGenerator must be used within AppProvider');
  }
  const {
    state,
    setGeneratedCode,
    setGeneratedFiles,
    setStep,
    setLoading,
    setError,
  } = context;
  const [selectedFile, setSelectedFile] = useState<string>('');

  useEffect(() => {
    if (
      state.detectedComponents.length > 0 &&
      Object.keys(state.userResponses).length > 0 &&
      state.generatedCode === ''
    ) {
      generateCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.detectedComponents, state.userResponses]);

  const generateCode = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          components: state.detectedComponents,
          responses: state.userResponses,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate code: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.code || !data.files || data.files.length === 0) {
        throw new Error('Failed to generate valid code. Please try again or check your API keys.');
      }
      
      // Validate that we got actual generated code
      if (data.code.includes('My Website') && data.code.includes('Generated Website')) {
        console.warn('Received generic template code - this might indicate API issues');
      }
      
      setGeneratedCode(data.code);
      setGeneratedFiles(data.files);
      
      if (data.files && data.files.length > 0) {
        setSelectedFile(data.files[0].path);
      }
      
      setStep('export');
    } catch (error: any) {
      console.error('Code generation error:', error);
      setError(error.message || 'Failed to generate code');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (state.generatedFiles.length === 0) {
      setError('No files to export');
      return;
    }

    try {
      setLoading(true);
      const zipBlob = await generateZipFile(state.generatedFiles);
      downloadBlob(zipBlob, 'generated-website.zip');
    } catch (error: any) {
      console.error('Export error:', error);
      setError(error.message || 'Failed to export files');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    const file = state.generatedFiles.find((f) => f.path === selectedFile);
    if (file) {
      navigator.clipboard.writeText(file.content);
      alert('Code copied to clipboard!');
    }
  };

  const selectedFileContent = state.generatedFiles.find(
    (f: FileStructure) => f.path === selectedFile
  )?.content || state.generatedCode;

  if (state.loading && state.generatedCode === '') {
    return (
      <div className="card max-w-4xl mx-auto text-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Generating your website code...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Generated Code</h2>
        <div className="flex gap-2">
          <button onClick={handleCopyCode} className="btn-secondary">
            Copy Code
          </button>
          <button onClick={handleExport} className="btn-primary">
            Download ZIP
          </button>
        </div>
      </div>

      {state.generatedFiles.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Files:</h3>
          <div className="flex flex-wrap gap-2">
            {state.generatedFiles.map((file: FileStructure) => (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file.path)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  selectedFile === file.path
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {file.path}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
          <span className="text-sm font-medium text-gray-700">
            {selectedFile || 'index.html'}
          </span>
        </div>
        <pre className="p-4 bg-gray-900 text-gray-100 overflow-x-auto max-h-[600px] overflow-y-auto">
          <code className="text-sm">{selectedFileContent}</code>
        </pre>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>Download the ZIP file containing all generated files</li>
          <li>Extract the files to a folder</li>
          <li>Open index.html in a web browser to view your website</li>
          <li>Customize the code as needed</li>
        </ol>
      </div>
    </div>
  );
}


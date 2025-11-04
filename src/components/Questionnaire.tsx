'use client';

import { useContext, useState, useEffect } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { QuestionnaireQuestion, DetectedComponent } from '@/types';

export default function Questionnaire() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('Questionnaire must be used within AppProvider');
  }
  const { state, updateUserResponse, setStep, setUserResponses, setLoading, setError } = context;
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    generateQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.detectedComponents]);

  const generateQuestions = () => {
    const generatedQuestions: QuestionnaireQuestion[] = [];

    // Only generate questions if we have detected components
    if (state.detectedComponents.length === 0) {
      setQuestions([]);
      return;
    }

    state.detectedComponents.forEach((component: DetectedComponent) => {
      // Generate questions based on component type and description
      switch (component.type) {
        case 'button':
          generatedQuestions.push({
            id: `q_${component.id}_action`,
            componentId: component.id,
            question: `What should the "${component.label}" button do? ${component.description ? `(It appears to: ${component.description})` : ''}`,
            type: 'select',
            options: ['Submit form', 'Navigate to page', 'Open modal', 'Trigger action', 'Delete item', 'Save data', 'Cancel action', 'Other'],
            required: true,
          });
          break;
        case 'input':
          generatedQuestions.push({
            id: `q_${component.id}_type`,
            componentId: component.id,
            question: `What type of input is "${component.label}"? ${component.description ? `(It appears to: ${component.description})` : ''}`,
            type: 'select',
            options: ['Text', 'Email', 'Password', 'Number', 'Date', 'Search', 'URL', 'Phone', 'Other'],
            required: true,
          });
          // Add additional question for input placeholder/label
          generatedQuestions.push({
            id: `q_${component.id}_placeholder`,
            componentId: component.id,
            question: `What placeholder text or label should "${component.label}" display?`,
            type: 'text',
            required: false,
          });
          break;
        case 'form':
          generatedQuestions.push({
            id: `q_${component.id}_purpose`,
            componentId: component.id,
            question: `What is the purpose of the form? ${component.description ? `(It appears to: ${component.description})` : ''}`,
            type: 'text',
            required: true,
          });
          generatedQuestions.push({
            id: `q_${component.id}_action`,
            componentId: component.id,
            question: `Where should the form submit to? (e.g., "/api/submit", "mailto:email@example.com", or leave blank for client-side handling)`,
            type: 'text',
            required: false,
          });
          break;
        case 'navigation':
          generatedQuestions.push({
            id: `q_${component.id}_links`,
            componentId: component.id,
            question: `What pages/links should be in the "${component.label}" navigation? (comma-separated, e.g., "Home, About, Contact")`,
            type: 'text',
            required: true,
          });
          break;
        case 'card':
          generatedQuestions.push({
            id: `q_${component.id}_content`,
            componentId: component.id,
            question: `What content should the "${component.label}" card display?`,
            type: 'text',
            required: true,
          });
          break;
        case 'modal':
          generatedQuestions.push({
            id: `q_${component.id}_purpose`,
            componentId: component.id,
            question: `What should the "${component.label}" modal display or do?`,
            type: 'text',
            required: true,
          });
          break;
        case 'slider':
          generatedQuestions.push({
            id: `q_${component.id}_range`,
            componentId: component.id,
            question: `What is the range for the "${component.label}" slider? (e.g., "0-100", "1-5", "price range")`,
            type: 'text',
            required: true,
          });
          break;
        default:
          generatedQuestions.push({
            id: `q_${component.id}_description`,
            componentId: component.id,
            question: `Describe the functionality of "${component.label}": ${component.description ? `(It appears to: ${component.description})` : ''}`,
            type: 'text',
            required: true,
          });
      }
    });

    setQuestions(generatedQuestions);
  };

  const handleAnswer = (value: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion) {
      updateUserResponse(currentQuestion.id, value);
    }
  };

  const handleNext = () => {
    const currentQuestion = questions[currentQuestionIndex];
    
    if (currentQuestion && currentQuestion.required && !state.userResponses[currentQuestion.id]) {
      setError('Please answer this question before continuing');
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setError(null);
    } else {
      // All questions answered, proceed to code generation
      setStep('generation');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setError(null);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? state.userResponses[currentQuestion.id] : '';

  if (questions.length === 0) {
    return (
      <div className="card max-w-4xl mx-auto text-center">
        <p className="text-gray-600">Preparing questions...</p>
      </div>
    );
  }

  return (
    <div className="card max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Component Questions</h2>
      <p className="text-gray-600 text-center mb-6">
        Help us understand your requirements better
      </p>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-600">
            {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {currentQuestion && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>

            {currentQuestion.type === 'text' && (
              <textarea
                className="input-field min-h-[100px]"
                placeholder="Type your answer here..."
                value={currentAnswer}
                onChange={(e) => handleAnswer(e.target.value)}
              />
            )}

            {currentQuestion.type === 'select' && currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((option) => (
                  <label
                    key={option}
                    className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={option}
                      checked={currentAnswer === option}
                      onChange={(e) => handleAnswer(e.target.value)}
                      className="mr-3"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button onClick={handleNext} className="btn-primary">
              {currentQuestionIndex === questions.length - 1 ? 'Generate Code' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


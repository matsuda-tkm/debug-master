import { useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { Challenge } from '../types/challenge';
import { TestResult } from '../types/challengeEditor';

// API Response types
interface CodeGenerationResponse {
  code?: string;
  explanation?: string;
  error?: string;
}

interface CodeGenerationRequest {
  challenge?: string;
  testCases?: unknown[];
}

export function useCodeGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [explanation, setExplanation] = useState('');
  const [aiGeneratedCode, setAiGeneratedCode] = useState<string | null>(null);
  const [lastFailingCode, setLastFailingCode] = useState<string | null>(null);

  const handleGenerateCode = async (challenge: Challenge | null, setCode: (code: string) => void, setCurrentStep: (step: number) => void) => {
    setIsGenerating(true);
    setGenerationError('');
    setCurrentStep(2);

    try {
      const requestBody: CodeGenerationRequest = {
        challenge: challenge?.instructions,
        testCases: challenge?.testCases,
      };

      const response = await fetch(API_ENDPOINTS.GENERATE_CODE, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json() as CodeGenerationResponse;
      console.log('Generated code response:', data);

      if (!response.ok || data.error) {
        setGenerationError(data.error || 'An unknown error occurred.');
        return;
      }

      if (data.code) {
        setCode(data.code);
        setAiGeneratedCode(data.code);
      }
      if (data.explanation) {
        setExplanation(data.explanation);
      }
    } catch (error) {
      console.error('Error generating code: ', error);
      const errorMessage = error instanceof Error 
        ? `Failed to connect to code generation service: ${error.message}`
        : 'Failed to connect to code generation service.';
      setGenerationError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    generationError,
    explanation,
    aiGeneratedCode,
    lastFailingCode,
    setLastFailingCode,
    handleGenerateCode,
  };
}

export function useCodeExecution() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const handleRunCode = async (
    code: string,
    challenge: Challenge | null,
    setCurrentStep: (step: number) => void,
    setLastFailingCode: (code: string | null) => void
  ) => {
    if (!challenge) return;
    setIsRunning(true);
    setTestResults([]);
    setCurrentStep(3);

    try {
      const response = await fetch(API_ENDPOINTS.RUN_PYTHON, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          testCases: challenge.testCases,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';
      let anyFailure = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as TestResult;
              if (data.status && data.status !== 'success') {
                anyFailure = true;
              }
              setTestResults((prev) => [...prev, data]);
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
        buffer = lines[lines.length - 1];
      }
      // After stream ends, remember the current code as failing snapshot if any test failed
      if (anyFailure) {
        setLastFailingCode(code);
      }
    } catch (error) {
      console.error('Error running code:', error);
      const errorMessage = error instanceof Error 
        ? `Failed to connect to Python server: ${error.message}`
        : 'Failed to connect to Python server. Please make sure the server is running.';
      
      setTestResults([
        {
          testCase: 1,
          status: 'error',
          message: errorMessage,
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const getPassingTestsCount = () => {
    return testResults.filter((result) => result.status === 'success').length;
  };

  return {
    isRunning,
    testResults,
    handleRunCode,
    getPassingTestsCount,
  };
}
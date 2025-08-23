import { useState } from 'react';

export function useChallenge() {
  const [code, setCode] = useState(`def main(numbers):
    # Write your solution here
    pass
  `);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);

  return {
    code,
    setCode,
    isRunning,
    setIsRunning,
    testResults,
    setTestResults,
    currentStep,
    setCurrentStep,
  };
}
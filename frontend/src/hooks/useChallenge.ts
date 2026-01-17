import { useState } from 'react';

export function useChallenge() {
  const [code, setCode] = useState(`##### 編集禁止 ######
test_cases = []

for i, input_value in enumerate(test_cases, start=1):
    print(f"---- テストケース{i} ----")
##### 編集禁止 ######
    #### ここから編集
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

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { challengesData } from './challengesData';
import ProblemIntroScreen from './ProblemIntroScreen';
import BugCodeDisplayScreen from './BugCodeDisplayScreen';
import CodeFixingScreen from './CodeFixingScreen';
import CelebrationScreen from './CelebrationScreen';

enum Screen {
  PROBLEM_INTRO = 'problem_intro',
  BUG_CODE_DISPLAY = 'bug_code_display',
  CODE_FIXING = 'code_fixing',
  CELEBRATION = 'celebration',
}

function ChallengeEditor() {
  const navigate = useNavigate();
  const { themeId } = useParams();
  const challenge = challengesData.find((c) => c.id === themeId);

  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.PROBLEM_INTRO);
  
  const [code, setCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const [successMessage, setSuccessMessage] = useState('');
  const [explanation, setExplanation] = useState('');
  
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hintError, setHintError] = useState('');
  const [hint, setHint] = useState('');
  
  const [showVideo, setShowVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    if (!challenge) {
      navigate('/');
    }
  }, [challenge, navigate]);

  const handleAcceptMission = () => {
    setCurrentScreen(Screen.BUG_CODE_DISPLAY);
  };

  const handleFixBug = () => {
    setCurrentScreen(Screen.CODE_FIXING);
  };

  const handleBackToCodeFixing = () => {
    setCurrentScreen(Screen.CODE_FIXING);
  };

  const handleGenerateCode = async () => {
    if (!challenge) return;
    
    setIsGenerating(true);
    setGenerationError('');
    
    try {
      const response = await fetch('/api/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challenge: challenge.instructions,
          difficulty: 'やさしい', // Fixed to easy difficulty for middle school students
          testCases: challenge.testCases,
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        setGenerationError(data.error);
      } else {
        setCode(data.code);
        setExplanation(data.explanation);
      }
    } catch (error) {
      console.error('Error generating code:', error);
      setGenerationError('コード生成中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunCode = async () => {
    if (!challenge) return;
    
    setIsRunning(true);
    setTestResults([]);
    
    const eventSource = new EventSource(
      `/api/run-python?${new URLSearchParams({
        timestamp: Date.now().toString(),
      }).toString()}`
    );
    
    fetch('/api/run-python', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        testCases: challenge.testCases,
      }),
    }).catch((error) => {
      console.error('Error sending code to run:', error);
      setIsRunning(false);
      eventSource.close();
    });
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.status === 'ok') {
        setTestResults((prev) => [
          ...prev,
          {
            status: data.status,
            message: data.message,
            testCase: data.testCaseNumber,
            input: data.input,
            expected: data.expected,
            actual: data.actual,
          },
        ]);
      } else if (data.status === 'forbidden') {
        setTestResults((prev) => [
          ...prev,
          {
            status: 'forbidden',
            message: data.message,
            testCase: data.testCaseNumber || prev.length + 1,
          },
        ]);
      }
    };
    
    eventSource.onerror = () => {
      setIsRunning(false);
      eventSource.close();
    };
    
    eventSource.addEventListener('done', () => {
      setIsRunning(false);
      eventSource.close();
    });
  };

  const handleSubmitSolution = () => {
    const allTestsPassed = testResults.length > 0 && 
      testResults.every((result) => result.status === 'success');
    
    if (allTestsPassed) {
      setSuccessMessage('おめでとう！すべてのテストに合格しました！');
      setCurrentScreen(Screen.CELEBRATION);
    }
  };

  const handleShowHint = async () => {
    if (!challenge || !code) return;
    
    setIsLoadingHint(true);
    setHintError('');
    
    try {
      const response = await fetch('/api/generate-hint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          instructions: challenge.instructions,
          examples: challenge.examples || '',
          testResults,
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        setHintError(data.error);
      } else {
        setHint(data.hint);
      }
    } catch (error) {
      console.error('Error generating hint:', error);
      setHintError('ヒント生成中にエラーが発生しました。');
    } finally {
      setIsLoadingHint(false);
    }
  };

  const handleShowVideo = (videoUrl: string) => {
    if (!videoUrl) return;
    
    setVideoUrl(videoUrl);
    setShowVideo(true);
  };

  const handleCloseVideo = () => {
    setShowVideo(false);
  };

  if (!challenge) {
    return null;
  }

  switch (currentScreen) {
    case Screen.PROBLEM_INTRO:
      return (
        <ProblemIntroScreen 
          challenge={challenge} 
          onAcceptMission={handleAcceptMission} 
        />
      );
      
    case Screen.BUG_CODE_DISPLAY:
      return (
        <BugCodeDisplayScreen 
          challenge={challenge}
          generatedCode={code}
          isGenerating={isGenerating}
          generationError={generationError}
          onFixBug={handleFixBug}
          onGenerateCode={handleGenerateCode}
        />
      );
      
    case Screen.CODE_FIXING:
      return (
        <CodeFixingScreen 
          challenge={challenge}
          code={code}
          setCode={setCode}
          testResults={testResults}
          isRunning={isRunning}
          handleRunCode={handleRunCode}
          handleSubmitSolution={handleSubmitSolution}
          handleShowHint={handleShowHint}
          isLoadingHint={isLoadingHint}
          hintError={hintError}
        />
      );
      
    case Screen.CELEBRATION:
      return (
        <CelebrationScreen 
          challenge={challenge}
          userAnswer={code}
          explanation={explanation}
          onClose={handleBackToCodeFixing}
        />
      );
      
    default:
      return null;
  }
}

export default ChallengeEditor;

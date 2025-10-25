import { Challenge } from './challenge';

export type HintLevel = {
  level: number;
  title?: string;
  content: string;
};

export type TestResult = {
  testCase: number;
  status: 'success' | 'failure' | 'forbidden' | 'error';
  message: string;
};

export interface SuccessModalProps {
  message: string;
  explanation: string;
  onClose: () => void;
  challenge: Challenge;
  userAnswer: string;
  lastFailingCode: string | null;
  aiGeneratedCode: string | null;
  testResults: TestResult[];
}

export interface VideoModalProps {
  videoSrc: string;
  onClose: () => void;
}

export const DEFAULT_HINT_TITLES: Record<number, string> = {
  1: '方向性のヒント',
  2: 'キーワードのヒント',
  3: '解法の骨子',
  4: '最終ヒント',
};

export const HINT_LEVEL_COUNT = 4;

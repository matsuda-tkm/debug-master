// challengesData.ts
export interface TestCase {
    input: any[];
    expected: any;
  }
  
  export interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    image: string;
    languages: string[];
    instructions: string;  // サイドバーに表示する課題文
    examples: string;      // 例をまとめたテキスト
    testCases: TestCase[];
  }
  
  export const challengesData: Challenge[] = [
    {
      id: 'list-manipulation',
      title: 'リスト操作',
      description: 'ソート、フィルタリング、内包表記などのリスト操作における一般的なバグを修正します。',
      difficulty: '簡単',
      image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=2728&ixlib=rb-4.0.3',
      languages: ['Python'],
      instructions: `リスト内のすべての数値の合計を計算する関数を作成してください。`,
      examples: `
  例1:
  入力: [1, 2, 3]
  出力: 6
  
  例2:
  入力: []
  出力: 0
      `,
      testCases: [
        { input: [[1, 2, 3]], expected: 6 },
        { input: [[]], expected: 0 },
        { input: [[5]], expected: 5 },
        { input: [[-1, -2, -3]], expected: -6 },
      ],
    },
    {
      id: 'dictionary-handling',
      title: '辞書操作',
      description: 'キーの存在確認、値の更新、辞書の反復処理など、辞書操作に関する問題をデバッグします。',
      difficulty: '中級',
      image: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3',
      languages: ['Python'],
      instructions: `ここに辞書に関する課題の説明文を入れる。`,
      examples: `
  例1:
  入力: ...
  出力: ...
      `,
      testCases: [
        // ここに辞書操作向けのテストケースを定義する
        { input: [{}], expected: {} },
      ],
    },
    {
      id: 'api-integration-python',
      title: 'API統合 (Python)',
      description: 'requestsライブラリを使用したAPI呼び出し、エラー処理、JSONデータの処理のバグを修正します。',
      difficulty: '難しい',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=2668&ixlib=rb-4.0.3',
      languages: ['Python'],
      instructions: `ここにAPI統合に関する課題の説明文を入れる。`,
      examples: `
  例1:
  入力: ...
  出力: ...
      `,
      testCases: [
        // ここにAPI統合向けのテストケースを定義
      ],
    },
    {
      id: 'file-handling',
      title: 'ファイル操作',
      description: 'ファイルの読み書き、例外処理、with文の使い方など、ファイル操作に関する問題をデバッグします。',
      difficulty: '中級',
      image: 'https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&q=80&w=2667&ixlib=rb-4.0.3',
      languages: ['Python'],
      instructions: `ここにファイル操作に関する課題の説明文を入れる。`,
      examples: `
  例1:
  入力: ...
  出力: ...
      `,
      testCases: [
        // ここにファイル操作向けのテストケースを定義
      ],
    },
  ];
  
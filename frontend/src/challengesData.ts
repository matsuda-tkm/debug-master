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
    instructions: string;
    examples: string;
    testCases: TestCase[];
  }
  
  export const challengesData: Challenge[] = [
    {
      id: 'list-conditional-transformation',
      title: 'リスト操作: 条件付き変換',
      description:
        'リスト内の正の整数を条件に基づき変換する関数をデバッグします。正の偶数はそのまま、正の奇数は3倍にし、負の数、0、非整数は無視する仕様です。',
      difficulty: '中級',
      image:
        'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=2728&ixlib=rb-4.0.3',
      languages: ['Python'],
      instructions: `整数のリストを入力として受け取り、各要素について以下の処理を行う関数を作成してください。
  - 正の偶数 → そのまま出力
  - 正の奇数 → 3倍して出力
  - 負の数、0、浮動小数点数は無視する
  
  結果は、元のリストの順序を保った新しいリストとして返してください。`,
      examples: `
  例1:
  入力: [1, 2, -3, 4, 5, 0, 3.5]
  出力: [3, 2, 4, 15]
  
  例2:
  入力: []
  出力: []
      `,
      testCases: [
        { input: [[1, 2, -3, 4, 5, 0, 3.5]], expected: [3, 2, 4, 15] },
        { input: [[-1, -2, 0, 2]], expected: [2] },
        { input: [[7, 8, 9]], expected: [21, 8, 27] },
        { input: [[3.14, 2.71]], expected: [] },
      ],
    },
    {
      id: 'nested-dictionary-update',
      title: '辞書操作: ネスト辞書の更新',
      description:
        'ネストされた辞書内の "target" キーを検出し、その値が数値の場合は2倍に更新する関数のデバッグ問題です。再帰的な辞書探索が必要となるため、LLMが処理の流れを誤解しやすい内容です。',
      difficulty: '難しい',
      image:
        'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3',
      languages: ['Python'],
      instructions: `辞書を入力として受け取り、任意の深さでネストされた辞書の中から、キー "target" が存在し、かつその値が数値の場合に、その値を2倍にしてください。
  その他の部分は変更せず、元の構造を保持して返す関数を作成してください。`,
      examples: `
  例:
  入力: {
    "a": {"target": 3, "other": 1},
    "b": {"target": 5},
    "c": 7,
    "d": {"nested": {"target": 10}}
  }
  出力: {
    "a": {"target": 6, "other": 1},
    "b": {"target": 10},
    "c": 7,
    "d": {"nested": {"target": 20}}
  }
      `,
      testCases: [
        {
          input: [{ a: { target: 3, other: 1 }, b: { target: 5 }, c: 7 }],
          expected: { a: { target: 6, other: 1 }, b: { target: 10 }, c: 7 },
        },
        {
          input: [{ x: { y: { target: 4 } }, z: { target: 'non-numeric' } }],
          expected: { x: { y: { target: 8 } }, z: { target: 'non-numeric' } },
        },
        { input: [{}], expected: {} },
      ],
    },
    {
      id: 'api-json-fetch',
      title: 'API統合: JSONデータ取得と検証',
      description:
        '外部APIからJSONデータを取得し、"data" キーの値を抽出する関数をデバッグします。HTTPステータスコードが200以外の場合や "data" キーが存在しない場合は例外を発生させる仕様です。',
      difficulty: '難しい',
      image:
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=2668&ixlib=rb-4.0.3',
      languages: ['Python'],
      instructions: `requestsライブラリを使用して、指定されたURLからJSONデータを取得してください。
  - HTTPステータスコードが200の場合、JSON内の "data" キーに対応する値を返す。
  - 200以外の場合、または "data" キーが存在しない場合は例外を発生させる。
  - タイムアウトは5秒に設定すること。`,
      examples: `
  例:
  URL: "https://api.example.com/info"
  （仮のレスポンス: {"data": {"id": 1, "name": "Alice"}}）
  出力: {"id": 1, "name": "Alice"}
      `,
      testCases: [
        { input: ["https://api.example.com/success"], expected: { id: 1, name: "Alice" } },
        { input: ["https://api.example.com/missingdata"], expected: "Exception" },
      ],
    },
    {
      id: 'log-error-extraction',
      title: 'ファイル操作: ログファイルからのエラーメッセージ抽出',
      description:
        'テキストファイル内のログから、"ERROR:" で始まるエラーメッセージを抽出する関数をデバッグします。ログ行から "ERROR:" 部分を除いたメッセージのみを返す必要があります。',
      difficulty: '中級',
      image:
        'https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&q=80&w=2667&ixlib=rb-4.0.3',
      languages: ['Python'],
      instructions: `ファイルパスを入力として受け取り、ファイル内の各行をチェックしてください。
  各行が "ERROR:" で始まる場合、"ERROR:" の後ろのテキストのみを抽出してリストに追加し、返す関数を作成してください。
  ファイルが存在しない、または空の場合は、空のリストを返してください。`,
      examples: `
  例:
  ファイル内容:
  INFO: システム起動
  ERROR: ネットワークに接続できません
  WARNING: メモリ使用率が高い
  ERROR: データベースにアクセスできません
  
  出力: ["ネットワークに接続できません", "データベースにアクセスできません"]
      `,
      testCases: [
        {
          input: ["path/to/log.txt"],
          expected: ["ネットワークに接続できません", "データベースにアクセスできません"],
        },
        { input: ["empty.txt"], expected: [] },
      ],
    },
  ];
  
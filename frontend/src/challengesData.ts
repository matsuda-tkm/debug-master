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

・ 正の偶数 → そのまま出力
・ 正の奇数 → 3倍して出力
・ 負の数、0、浮動小数点数は無視する

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
      'requestsライブラリを使って、https://httpbin.org のエンドポイントからJSONデータを取得し、レスポンス内の "args" オブジェクトにある "data" キーの値を抽出する関数をデバッグします。HTTPステータスコードやタイムアウト、エラーハンドリングの落とし穴に注意してください。',
    difficulty: '難しい',
    image:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=2668&ixlib=rb-4.0.3',
    languages: ['Python'],
    instructions: `requestsライブラリを使用して、指定されたURLからJSONデータを取得してください。
※URLは必ず https://httpbin.org/anything?data=... の形式となります。

仕様は以下の通りです：
・ レスポンスのHTTPステータスコードが200の場合、レスポンスJSON内の "args" オブジェクトを確認し、その中に "data" キーが存在するかチェックする。
・ "data" キーが存在する場合、その値はJSON文字列になっているので、これをパースして元のオブジェクトとして返すこと。
・ HTTPステータスコードが200以外、または "data" キーが存在しない場合は文字列"Error"を返すこと。`,
    examples: `
例:
入力: "https://httpbin.org/anything?data={'id':1,'name':'Alice'}"
出力: {"id": 1, "name": "Alice"}
    `,
    testCases: [
      {
        input: ["https://httpbin.org/anything?data={\"id\":1,\"name\":\"Alice\"}"],
        expected: { id: 1, name: "Alice" },
      },
      {
        // URLに "data" キーが含まれない場合
        input: ["https://httpbin.org/anything?info={\"id\":2}"],
        expected: "Error",
      },
    ],
  },
  {
    id: 'dynamic-config-validator',
    title: '動的設定バリデーター: ネスト設定の検証',
    description:
      'ネストされた設定辞書 (config) が、仕様辞書 (spec) で示された各項目の型および制約を満たしているかを再帰的に検証する関数を作成してください。すべてのキーが仕様に適合する場合は True を、1つでも不適合な場合や仕様のキーが存在しない場合は "Invalid" を返します。',
    difficulty: '難しい',
    image:
      'https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&q=80&w=2667&ixlib=rb-4.0.3',
    languages: ['Python'],
    instructions: `以下の仕様に従って、設定オブジェクト (config) と仕様オブジェクト (spec) を入力として受け取り、設定が仕様を満たすか検証する関数を作成してください。

【入力】
- config: ネストされた辞書（Pythonの dict）で、各キーの値は任意の型・構造。
- spec: 同じ構造を持つ辞書で、各キーに対して期待される型や制約を指定します。
  - もし spec の値が文字列の場合、その値は期待される型を示します（例："string", "number", "boolean"）。
  - もし spec の値がオブジェクトの場合、必ず "type" キーを持ち、数値の場合は任意で "min" および "max" を指定できます。例: { type: "number", min: 1, max: 65535 }。
  - ネストされた辞書の場合は、spec も同じ構造になっており、再帰的に検証します。

【出力】
- config のすべてのキーが spec の定める型および制約を満たす場合は True を返す。
- 1つでも仕様を満たさない場合、または spec に定義されたキーが config に存在しない場合は、固定文字列 "Invalid" を返す。

【注意点】
- 数値の場合、spec に "min" や "max" が定義されていれば、その範囲内であるかをチェックする。
- config が空の辞書で、spec も空の場合は True を返す。
- 再帰的に全てのキーを検証する必要があります。
`,
    examples: `
例:
config = {
  "host": "localhost",
  "port": 8080,
  "debug": true,
  "thresholds": {
    "min": 0,
    "max": 100
  }
}
spec = {
  "host": "string",
  "port": { "type": "number", "min": 1, "max": 65535 },
  "debug": "boolean",
  "thresholds": {
    "min": { "type": "number", "min": 0 },
    "max": { "type": "number", "max": 1000 }
  }
}
出力: True
`,
testCases: [
  {
    input: [
      {
        host: "localhost",
        port: 8080,
        debug: true,
        thresholds: { min: 0, max: 100 },
      },
      {
        host: "string",
        port: { type: "number", min: 1, max: 65535 },
        debug: "boolean",
        thresholds: {
          min: { type: "number", min: 0 },
          max: { type: "number", max: 1000 },
        },
      },
    ],
    expected: true,
  },
  {
    input: [
      {
        host: "localhost",
        port: 70000,
        debug: "yes",
        thresholds: { min: -5, max: 1200 },
      },
      {
        host: "string",
        port: { type: "number", min: 1, max: 65535 },
        debug: "boolean",
        thresholds: {
          min: { type: "number", min: 0 },
          max: { type: "number", max: 1000 },
        },
      },
    ],
    expected: "Invalid",
  },
  {
    input: [
      {
        host: "localhost",
        port: 8080,
        thresholds: { min: 0, max: 100 },
      },
      {
        host: "string",
        port: { type: "number", min: 1, max: 65535 },
        debug: "boolean",
        thresholds: {
          min: { type: "number", min: 0 },
          max: { type: "number", max: 1000 },
        },
      },
    ],
    expected: "Invalid",
  },
],
},
];

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
  video: string;
  testCases: TestCase[];
}

export const challengesData: Challenge[] = [
  {
    id: 'hello-world',
    title: 'はじめてのプログラム',
    description:
      '自分の名前を表示するプログラムを作成します。Pythonの基本的な出力を学びましょう。',
    difficulty: '入門',
    image:
      'images/character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Python'],
    instructions: `自分の名前を「こんにちは、○○です！」の形で表示する関数を作成してください。
  
  【仕様】
  ・ main関数の引数として名前を受け取る
  ・ print()を使って「こんにちは、[名前]です！」と表示する
  ・ 例: main("太郎") が呼ばれたら、「こんにちは、太郎です！」と表示`,
    examples: `
  例:
  name = "花子"
  出力: こんにちは、花子です！
    `,
    video: "/videos/sum-n.mp4",
    testCases: [
      { input: ["太郎"], expected: "こんにちは、太郎です！" },
      { input: ["花子"], expected: "こんにちは、花子です！" },
      { input: ["田中"], expected: "こんにちは、田中です！" },
    ]
  },
  {
    id: 'age-calculator',
    title: '年齢計算プログラム',
    description:
      '生まれ年を入力して、現在の年齢を計算するプログラムを作成します。計算の基本を学びましょう。',
    difficulty: '入門',
    image:
      'images/character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Python'],
    instructions: `生まれ年を入力として受け取り、2024年における年齢を計算して表示する関数を実装してください。
  
  【仕様】
  ・ main関数の引数として birth_year を受け取る
  ・ 2024 - birth_year で計算する
  ・ print()を使って計算結果を表示する`,
    examples: `
  例1:
  入力: 2010
  出力: 14
  
  例2:
  入力: 2005
  出力: 19
    `,
    video: "/videos/sum-n.mp4",
    testCases: [
      { input: [2010], expected: "14" },
      { input: [2005], expected: "19" },
      { input: [2000], expected: "24" },
      { input: [1995], expected: "29" },
    ]
  },
  {
    id: 'temperature-judge',
    title: '温度の判定',
    description:
      '温度を入力して、暑い・普通・寒いを判定するプログラムを作成します。条件分岐の基本を学びましょう。',
    difficulty: '初級',
    image:
      'images/character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Python'],
    instructions: `温度を入力として受け取り、以下の基準で判定して表示する関数を実装してください。
  
  【仕様】
  ・ main関数の引数として温度を受け取る
  ・ 30度以上: "暑い"
  ・ 15度以上30度未満: "普通"
  ・ 15度未満: "寒い"
  ・ print()を使って判定結果を表示する`,
    examples: `
  例1:
  入力: 35
  出力: "暑い"
  
  例2:
  入力: 20
  出力: "普通"
  
  例3:
  入力: 10
  出力: "寒い"
    `,
    video: "/videos/sum-n.mp4",
    testCases: [
      { input: [35], expected: "暑い" },
      { input: [30], expected: "暑い" },
      { input: [25], expected: "普通" },
      { input: [15], expected: "普通" },
      { input: [10], expected: "寒い" },
      { input: [0], expected: "寒い" },
    ]
  },
  {
    id: 'sum-n',
    title: '1からnまでの数の合計',
    description:
      '1からnまでの数を全て足し算するプログラムを作成します。ループの基本を学びましょう。',
    difficulty: '初級',
    image:
      'images/sum_character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Python'],
    instructions: `整数 n を入力として受け取り、1からnまでの整数の合計を計算して表示する関数を実装してください。
  
  【仕様】
  ・ main関数の引数として n を受け取る
  ・ n は 1 以上の整数
  ・ 例: n = 5 の場合、1 + 2 + 3 + 4 + 5 = 15 となる
  ・ for文やwhile文を使って計算してみましょう
  ・ print()を使って計算結果を表示する`,
    examples: `
  例1:
  入力: 3
  出力: 6 (1+2+3)
  
  例2:
  入力: 5
  出力: 15 (1+2+3+4+5)
    `,
    video: "/videos/sum-n.mp4",
    testCases: [
      { input: [1], expected: "1" },
      { input: [3], expected: "6" },
      { input: [5], expected: "15" },
      { input: [10], expected: "55" },
    ]
  },
  {
    id: 'reverse-string',
    title: '文字列をひっくり返そう',
    description:
      '文字列を逆順に並べ変えるプログラムを作成します。文字列操作の基本を学びましょう。',
    difficulty: '初級',
    image:
      'images/reverse_character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Python'],
    instructions: `文字列 s を入力として受け取り、文字の順番を逆にした文字列を表示する関数を実装してください。
  
  【仕様】
  ・ main関数の引数として s を受け取る
  ・ s は任意の文字列
  ・ 例: s = "abc" の場合、"cba" を表示する
  ・ Pythonのスライス機能を使ってみましょう
  ・ print()を使って結果を表示する`,
    examples: `
  例1:
  入力: "hello"
  出力: "olleh"
  
  例2:
  入力: "python"
  出力: "nohtyp"
    `,
    video: "/videos/reverse-string.mp4",
    testCases: [
      { input: ["hello"], expected: "olleh" },
      { input: ["python"], expected: "nohtyp" },
      { input: ["abc"], expected: "cba" },
      { input: ["12345"], expected: "54321" },
    ]
  },
  {
    id: 'multiplication-table',
    title: 'かけ算の九九',
    description:
      '指定した数の九九を表示するプログラムを作成します。ループと計算の組み合わせを学びましょう。',
    difficulty: '初級',
    image:
      'images/character.png?auto=format&fit=crop&w=800&q=80',
    languages: ['Python'],
    instructions: `数字 n を入力として受け取り、n の九九（1〜9まで）の計算結果を表示する関数を実装してください。
  
  【仕様】
  ・ main関数の引数として n を受け取る
  ・ n × 1, n × 2, ..., n × 9 の結果を計算する
  ・ 例: n = 3 の場合、[3, 6, 9, 12, 15, 18, 21, 24, 27] を表示する
  ・ print()を使って結果をリスト形式で表示する`,
    examples: `
  例1:
  入力: 2
  出力: [2, 4, 6, 8, 10, 12, 14, 16, 18]
  
  例2:
  入力: 5
  出力: [5, 10, 15, 20, 25, 30, 35, 40, 45]
    `,
    video: "/videos/sum-n.mp4",
    testCases: [
      { input: [2], expected: "[2, 4, 6, 8, 10, 12, 14, 16, 18]" },
      { input: [3], expected: "[3, 6, 9, 12, 15, 18, 21, 24, 27]" },
      { input: [5], expected: "[5, 10, 15, 20, 25, 30, 35, 40, 45]" },
    ]
  },
];

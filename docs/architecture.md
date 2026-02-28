# 全体アーキテクチャ

## 技術スタック

| レイヤー | 技術 | バージョン |
|---|---|---|
| **フロントエンド** | React + TypeScript | React 18, TypeScript 5.5 |
| **ビルドツール** | Vite | 5.4 |
| **スタイリング** | Tailwind CSS + PostCSS | Tailwind 3.4 |
| **コードエディタ** | CodeMirror 6 (@uiw/react-codemirror) | 4.23 |
| **バックエンド** | Python + FastAPI | Python 3.13, FastAPI 0.116 |
| **AI** | Google Gemini API (google-genai) | 1.36 |
| **データベース** | JSON ファイル | - |
| **デプロイ** | Docker Compose | - |

## サービス構成

```mermaid
graph LR
    subgraph client [クライアント]
        Browser["ブラウザ"]
    end

    subgraph docker [Docker Compose]
        Frontend["Frontend<br/>React + Vite<br/>:5173"]
        Backend["Backend<br/>FastAPI<br/>:8000"]
    end

    subgraph external [外部サービス]
        Gemini["Google Gemini API"]
    end

    subgraph storage [データストア]
        JSON["challenges.json"]
    end

    Browser -->|HTTP| Frontend
    Frontend -->|REST API| Backend
    Backend -->|生成リクエスト| Gemini
    Backend -->|読み書き| JSON
```

## データフロー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant FE as Frontend
    participant BE as Backend
    participant AI as Gemini API
    participant DB as challenges.json

    User->>FE: ミッション選択
    FE->>BE: GET /api/challenges/{id}
    BE->>DB: チャレンジ取得
    DB-->>BE: チャレンジデータ
    BE-->>FE: チャレンジJSON
    FE->>BE: POST /api/generate-code
    BE->>AI: バグ入りコード生成依頼
    AI-->>BE: 3つのバグ入りコード
    BE->>BE: テスト実行で検証
    BE-->>FE: 選ばれたバグ入りコード
    FE-->>User: コードエディタに表示

    User->>FE: コード修正 + テスト実行
    FE->>BE: POST /api/run-python (SSE)
    BE->>BE: exec() でコード実行
    BE-->>FE: テスト結果ストリーム
    FE-->>User: テスト結果表示

    alt 全テスト成功
        FE->>BE: POST /api/generate-explanation
        BE->>AI: 解説生成依頼
        AI-->>BE: 解説JSON
        BE-->>FE: 解説データ
        FE-->>User: 成功モーダル表示
    else リタイア
        FE->>BE: POST /api/generate-retire-explanation
        BE->>AI: リタイア解説生成依頼
        AI-->>BE: 正解コード + 解説
        BE-->>FE: リタイア解説データ
        FE-->>User: リタイアモーダル表示
    end
```

## ユーザーフロー

```mermaid
flowchart TD
    Start["ホーム画面"] --> Select["ミッションを選択"]
    Select --> Load["チャレンジ読み込み"]
    Load --> Generate["AI がバグ入りコード生成"]
    Generate --> Edit["コードエディタで修正"]
    Edit --> Run["テスト実行"]
    Run --> Check{"全テスト成功?"}
    Check -->|はい| Success["成功モーダル + 解説表示"]
    Check -->|いいえ| Hint["ヒントを確認"]
    Hint --> Edit
    Edit --> Retire["リタイア"]
    Retire --> RetireModal["リタイアモーダル + 正解表示"]
    Success --> Start
    RetireModal --> Start
```

## ディレクトリ構成

```
debug-master/
├── frontend/                  # React フロントエンド
│   ├── src/
│   │   ├── components/        # React コンポーネント
│   │   ├── config/            # API エンドポイント設定
│   │   ├── hooks/             # カスタムフック
│   │   ├── services/          # API クライアント
│   │   ├── types/             # TypeScript 型定義
│   │   ├── App.tsx            # ルーティング定義
│   │   ├── ChallengeEditor.tsx # メインのチャレンジ画面
│   │   ├── challengesData.ts  # 静的チャレンジデータ
│   │   ├── main.tsx           # エントリーポイント
│   │   └── index.css          # グローバルスタイル
│   ├── public/images/                # 画像アセット
│   ├── videos/                # 動画アセット
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/                   # FastAPI バックエンド
│   ├── api/
│   │   └── challenges.py      # チャレンジ CRUD ハンドラ
│   ├── database/
│   │   ├── data/
│   │   │   └── challenges.json # チャレンジデータ
│   │   ├── models/
│   │   │   └── challenge.py   # データモデル
│   │   └── challenge_repository.py  # リポジトリ
│   ├── app.py                 # FastAPI アプリケーション
│   ├── code_runner.py         # Python コード実行エンジン
│   ├── config.py              # 設定 + システムプロンプト
│   ├── gemini_utils.py        # Gemini API ユーティリティ
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env                   # 環境変数 (Git 管理外)
│
├── agents/                    # Manim アニメーション生成ツール (独立)
│   ├── app.py
│   ├── Dockerfile
│   ├── Makefile
│   └── requirements.txt
│
├── docs/                      # ドキュメント
├── compose.yml                # Docker Compose 定義
├── README.md
└── LICENSE
```

## 関連ドキュメント

- フロントエンドの詳細 → [frontend.md](./frontend.md)
- バックエンドの詳細 → [backend.md](./backend.md)
- API リファレンス → [api-reference.md](./api-reference.md)
- 環境構築手順 → [setup.md](./setup.md)

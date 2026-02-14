# 新アーキテクチャ設計書

## 概要

Debug Master を Docker Compose によるローカル構成から、Google Cloud (Cloud Run, Firestore) + Vercel によるクラウド構成に移行する。認証には Firebase Authentication (Google SSO) を採用し、管理者ユーザーによるチャレンジ管理機能を追加する。

## 技術スタック (移行後)

| レイヤー | 技術 | 備考 |
|---|---|---|
| **フロントエンド** | React 18 + TypeScript + Vite | 変更なし |
| **ホスティング (FE)** | Vercel | GitHub 連携で自動デプロイ |
| **バックエンド** | Python 3.13 + FastAPI | 変更なし |
| **ホスティング (BE)** | Google Cloud Run | Docker コンテナで実行 |
| **データベース** | Cloud Firestore | JSON ファイルから移行 |
| **認証** | Firebase Authentication | Google SSO、管理者ロール |
| **AI** | Google Gemini API | 変更なし |
| **シークレット管理** | Google Secret Manager | API キー等を安全に管理 |
| **コンテナレジストリ** | Artifact Registry | Docker イメージの保存 |
| **CI/CD** | GitHub Actions | 自動テスト・デプロイ |

## サービス構成図

```mermaid
graph TB
    subgraph client [クライアント]
        Browser["ブラウザ"]
    end

    subgraph vercel [Vercel]
        Frontend["Frontend<br>React + Vite<br>静的ホスティング"]
    end

    subgraph gcp [Google Cloud]
        CloudRun["Cloud Run<br>FastAPI<br>バックエンド API"]
        Firestore["Cloud Firestore<br>データベース"]
        SecretMgr["Secret Manager<br>シークレット管理"]
        ArtifactReg["Artifact Registry<br>Docker イメージ"]
    end

    subgraph firebase [Firebase]
        FireAuth["Firebase Authentication<br>Google SSO"]
    end

    subgraph external [外部サービス]
        Gemini["Google Gemini API"]
    end

    Browser -->|HTTPS| Frontend
    Frontend -->|REST API + Bearer Token| CloudRun
    Browser -->|認証| FireAuth
    CloudRun -->|トークン検証| FireAuth
    CloudRun -->|読み書き| Firestore
    CloudRun -->|シークレット取得| SecretMgr
    CloudRun -->|AI 生成リクエスト| Gemini
```

## 現行構成との比較

```mermaid
graph LR
    subgraph before [現行構成]
        direction TB
        B_FE["Frontend<br>Docker + Vite<br>:5173"]
        B_BE["Backend<br>Docker + FastAPI<br>:8000"]
        B_DB["challenges.json"]
        B_FE --> B_BE --> B_DB
    end

    subgraph after [移行後構成]
        direction TB
        A_FE["Frontend<br>Vercel"]
        A_BE["Backend<br>Cloud Run"]
        A_DB["Firestore"]
        A_Auth["Firebase Auth"]
        A_FE --> A_BE --> A_DB
        A_FE --> A_Auth
        A_BE --> A_Auth
    end

    before -.->|移行| after
```

## 認証フロー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant FE as Frontend (Vercel)
    participant Auth as Firebase Auth
    participant BE as Backend (Cloud Run)
    participant FS as Firestore

    User->>FE: アクセス
    FE->>FE: 認証状態チェック

    alt 未認証
        FE->>User: ログイン画面表示
        User->>Auth: Google ログイン
        Auth-->>FE: ID トークン
        FE->>FE: トークンを保存
    end

    FE->>BE: API リクエスト (Authorization: Bearer <token>)
    BE->>Auth: トークン検証
    Auth-->>BE: ユーザー情報 (uid, email)

    alt 管理者操作 (POST/PUT/DELETE /api/challenges)
        BE->>FS: users/{uid} のロール確認
        FS-->>BE: role: admin
        alt 管理者でない
            BE-->>FE: 403 Forbidden
        end
    end

    BE->>FS: データ操作
    FS-->>BE: 結果
    BE-->>FE: レスポンス
    FE-->>User: 画面更新
```

## データフロー (チャレンジ利用)

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant FE as Frontend (Vercel)
    participant BE as Backend (Cloud Run)
    participant AI as Gemini API
    participant FS as Firestore

    User->>FE: ミッション選択
    FE->>BE: GET /api/challenges/{id}
    BE->>FS: challenges/{id} 取得
    FS-->>BE: チャレンジデータ
    BE-->>FE: チャレンジ JSON

    FE->>BE: POST /api/generate-code
    BE->>AI: バグ入りコード生成依頼
    AI-->>BE: 3 つのバグ入りコード
    BE->>BE: テスト実行で検証
    BE-->>FE: 選ばれたバグ入りコード
    FE-->>User: コードエディタに表示

    User->>FE: コード修正 + テスト実行
    FE->>BE: POST /api/run-python (SSE)
    BE->>BE: サンドボックス内で exec()
    BE-->>FE: テスト結果ストリーム
    FE-->>User: テスト結果表示

    alt 全テスト成功
        FE->>BE: POST /api/generate-explanation
        BE->>AI: 解説生成依頼
        AI-->>BE: 解説 JSON
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

## ルーティング (移行後)

| パス | コンポーネント | 認証 | 説明 |
|---|---|---|---|
| `/login` | `LoginPage` | 不要 | Google ログイン画面 |
| `/` | `ThemeSelection` | 必要 | ホーム画面。ミッション一覧 |
| `/challenge/:themeId` | `ChallengeEditor` | 必要 | チャレンジ画面 |
| `/admin` | `AdminDashboard` | 管理者のみ | 管理者ダッシュボード |
| `/admin/challenges` | `ChallengeManager` | 管理者のみ | チャレンジ CRUD 管理 |
| `/admin/challenges/new` | `ChallengeForm` | 管理者のみ | チャレンジ新規作成 |
| `/admin/challenges/:id/edit` | `ChallengeForm` | 管理者のみ | チャレンジ編集 |

```mermaid
flowchart TD
    main["main.tsx"] --> BrowserRouter
    BrowserRouter --> App["App.tsx"]
    App --> Login["/login → LoginPage"]
    App --> PrivateRoute["PrivateRoute (認証必須)"]
    PrivateRoute --> Home["/  →  ThemeSelection"]
    PrivateRoute --> Challenge["/challenge/:themeId  →  ChallengeEditor"]
    PrivateRoute --> AdminRoute["AdminRoute (管理者のみ)"]
    AdminRoute --> AdminDash["/admin  →  AdminDashboard"]
    AdminRoute --> AdminChallenges["/admin/challenges  →  ChallengeManager"]
    AdminRoute --> AdminNew["/admin/challenges/new  →  ChallengeForm"]
    AdminRoute --> AdminEdit["/admin/challenges/:id/edit  →  ChallengeForm"]
```

## ディレクトリ構成 (移行後の変更点)

```
debug-master/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginPage.tsx          # [新規] ログイン画面
│   │   │   ├── ThemeSelection.tsx
│   │   │   └── ...
│   │   ├── admin/                     # [新規] 管理者画面
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── ChallengeManager.tsx
│   │   │   └── ChallengeForm.tsx
│   │   ├── config/
│   │   │   ├── api.ts
│   │   │   └── firebase.ts           # [新規] Firebase 設定
│   │   ├── contexts/                  # [新規] コンテキスト
│   │   │   └── AuthContext.tsx
│   │   ├── guards/                    # [新規] ルートガード
│   │   │   ├── PrivateRoute.tsx
│   │   │   └── AdminRoute.tsx
│   │   ├── hooks/
│   │   ├── services/                  # [変更] 認証トークン付与
│   │   ├── types/
│   │   ├── App.tsx                    # [変更] ルート追加
│   │   ├── ChallengeEditor.tsx
│   │   └── main.tsx
│   ├── package.json                   # [変更] firebase 追加
│   └── ...
│
├── backend/
│   ├── api/
│   │   └── challenges.py              # [変更] 認証チェック追加
│   ├── database/
│   │   ├── challenge_repository.py    # [変更] Firestore クライアントに書き換え
│   │   └── models/
│   │       └── challenge.py
│   ├── middleware/                     # [新規] ミドルウェア
│   │   └── auth.py                    # Firebase Auth トークン検証
│   ├── app.py                         # [変更] CORS、認証ミドルウェア追加
│   ├── config.py                      # [変更] Secret Manager 統合
│   ├── code_runner.py                 # [変更] セキュリティ強化
│   ├── gemini_utils.py
│   ├── requirements.txt               # [変更] GCP パッケージ追加
│   ├── Dockerfile                     # [変更] 最適化
│   └── .env                           # ローカル開発用のみ
│
├── .github/                           # [新規]
│   └── workflows/
│       ├── deploy-backend.yml
│       └── test.yml
│
├── docs/                              # 現行仕様ドキュメント
├── docs-new/                          # クラウド化改修計画
├── compose.yml                        # ローカル開発専用に整理
├── README.md                          # [変更] クラウド構成に更新
└── LICENSE
```

> `agents/` ディレクトリは削除される。

## API エンドポイント (変更点)

既存の API エンドポイントは基本的に維持し、認証のみ追加する。

| メソッド | パス | 認証 | 変更点 |
|---|---|---|---|
| GET | `/api/health` | なし | 変更なし |
| GET | `/api/challenges` | 必要 | 認証チェック追加 |
| GET | `/api/challenges/{id}` | 必要 | 認証チェック追加 |
| POST | `/api/challenges` | 管理者 | 認証 + 管理者チェック追加 |
| PUT | `/api/challenges/{id}` | 管理者 | 認証 + 管理者チェック追加 |
| DELETE | `/api/challenges/{id}` | 管理者 | 認証 + 管理者チェック追加 |
| POST | `/api/run-python` | 必要 | 認証チェック追加 |
| POST | `/api/generate-code` | 必要 | 認証チェック追加 |
| POST | `/api/generate-hint` | 必要 | 認証チェック追加 |
| POST | `/api/generate-explanation` | 必要 | 認証チェック追加 |
| POST | `/api/generate-retire-explanation` | 必要 | 認証チェック追加 |

## 関連ドキュメント

- 移行計画 → [migration-plan.md](./migration-plan.md)
- インフラ構成 → [infrastructure.md](./infrastructure.md)
- セキュリティ設計 → [security.md](./security.md)
- DB 移行設計 → [database-migration.md](./database-migration.md)
- 現行アーキテクチャ → [../docs/architecture.md](../docs/architecture.md)

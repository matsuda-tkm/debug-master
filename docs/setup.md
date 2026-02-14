# 環境構築・デプロイ手順

## 前提条件

| ツール | 用途 |
|---|---|
| **Docker** + **Docker Compose** | コンテナでの起動（推奨） |
| **Node.js** (v18+) | フロントエンドのローカル開発 |
| **Python** (3.13+) | バックエンドのローカル開発 |

## 環境変数の設定

### Gemini API キーの取得

1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセスし、API キーを取得します。

2. `backend/.env` ファイルを作成し、API キーを記載します。

```bash
GEMINI_API_KEY=your_api_key_here
```

> `.env` ファイルは `.gitignore` に含まれているため、Git にコミットされません。

## Docker Compose での起動（推奨）

### コンテナの起動

```bash
docker compose up --build -d
```

起動後、以下の URL にアクセスできます。

| サービス | URL |
|---|---|
| フロントエンド | http://localhost:5173 |
| バックエンド | http://localhost:8000 |
| ヘルスチェック | http://localhost:8000/api/health |

### コンテナの停止

```bash
docker compose down -v
```

### 再起動（リビルド込み）

```bash
docker compose down -v && docker compose up --build -d
```

### Docker Compose のサービス構成

`compose.yml` で定義されている 2 つのサービス:

| サービス | コンテナ名 | ポート | コマンド |
|---|---|---|---|
| `frontend` | `debug-master-frontend` | 5173 | `npm run dev` |
| `backend` | `debug-master-backend` | 8000 | `python app.py` |

ボリューム:

- `./frontend` → `/app` (ホットリロード用)
- `./backend` → `/app` (ホットリロード用)
- `node_modules` → 名前付きボリューム (コンテナ内で管理)

## ローカル開発（Docker なし）

### バックエンド

```bash
cd backend

# 仮想環境の作成と有効化
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 依存関係のインストール
pip install -r requirements.txt

# サーバー起動
python app.py
```

バックエンドが http://localhost:8000 で起動します。

### フロントエンド

```bash
cd frontend

# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
```

フロントエンドが http://localhost:5173 で起動します。

### フロントエンドの API 接続先変更

デフォルトではバックエンドの URL は `http://localhost:8000` です。変更が必要な場合は、環境変数 `VITE_API_BASE_URL` を設定するか、`frontend/src/config/api.ts` を編集します。

```typescript
// frontend/src/config/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
```

## ポート番号一覧

| ポート | サービス | 説明 |
|---|---|---|
| 5173 | Frontend (Vite) | React 開発サーバー |
| 8000 | Backend (Uvicorn) | FastAPI サーバー |
| 8501 | Agents (Streamlit) | Manim ツール（独立、compose.yml 外） |

## 設定ファイルの変更

### バックエンド設定

`backend/config.py` で以下の設定を変更できます。

| 設定 | デフォルト値 | 説明 |
|---|---|---|
| `PORT` | `8000` | サーバーポート |
| `GEMINI_MODEL_CANDIDATES` | `['gemini-3-flash-preview', 'gemini-2.5-flash']` | 使用する Gemini モデル |
| `GEMINI_TEMPERATURE` | `1.0` | 生成の温度パラメータ |

### テスト実行時の出力フォーマット

標準出力にはテストケースの区切りマーカーが必要です。

```
---- テストケース{i} ----
```

(`i` は 1 始まりの連番)

このマーカーがないとバックエンドはテスト結果を正しく判定できません。

## 関連ドキュメント

- 全体アーキテクチャ → [architecture.md](./architecture.md)
- Agents モジュールのセットアップ → [agents.md](./agents.md)

# Debug Master

## 概要

京大生が開発した新感覚プログラミング学習アプリDebug Master。AI生成のわざと間違えたコードを修正することで、間違い探しのように楽しくプログラミングを学べます。従来の「1から書く」学習よりハードルが低く、初心者でも気軽に体験可能！

## 実績

- [Open Hack U 2025 OSAKA](https://hacku.yahoo.co.jp/hacku2025_osaka/)
- [千代田区立麹町中学校 プログラミング部（KJHS-PC）](https://manju-s-6271.github.io/KJHS-PC/)

## 実行方法

### 環境変数の設定

#### 1. APIキーの設定

1. `backend/.env` を作成する。

2. [Google AI Studio](https://aistudio.google.com/app/apikey) でAPIキーを取得する。

3. `backend/.env` に取得したAPIキーを以下のように記載する。

```bash
GEMINI_API_KEY=your_api_key_here
```

#### 2. その他の環境変数（オプション）

必要に応じて以下の環境変数を設定できます：

```bash
# バックエンドサーバーのポート（デフォルト: 8000）
PORT=8000

# Gemini APIのモデル名（デフォルト: gemini-2.0-flash）
GEMINI_MODEL_NAME=gemini-2.0-flash

# Gemini APIの温度パラメータ（デフォルト: 0.5）
GEMINI_TEMPERATURE=0.5
```

### 設定値の変更方法

#### バックエンド設定の変更

`backend/config.py` ファイルで以下の設定を変更できます：

```python
# サーバー設定
PORT: int = 8000

# Gemini API設定
GEMINI_MODEL_NAME = "gemini-2.0-flash"
GEMINI_TEMPERATURE = 0.5
```

#### フロントエンド設定の変更

`frontend/src/config/api.ts` ファイルでAPIエンドポイントを変更できます：

```typescript
export const API_ENDPOINTS = {
  CHALLENGES: 'http://localhost:8000/api/challenges',
  RUN_PYTHON: 'http://localhost:8000/api/run-python',
  GENERATE_CODE: 'http://localhost:8000/api/generate-code',
  GENERATE_HINT: 'http://localhost:8000/api/generate-hint',
  RETIRE: 'http://localhost:8000/api/retire',
};
```

### コンテナの起動

1. ターミナルで以下を実行し、コンテナを起動する。

    ```bash
   docker compose up --build -d
   ```

2. http://localhost:5173 にアクセスする。


### コンテナの停止

```bash
docker compose down -v
```


### 再起動コマンド

```bash
docker compose down -v && docker compose up --build -d
```

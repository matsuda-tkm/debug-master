# Debug Master

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/matsuda-tkm/DebugMaster)

Open Hack U 2025 OSAKA

## 実行方法

### APIキーの設定

1. `backend/.env` を作成する。

2. [Notion](https://www.notion.so/matsuda-takumi/1b3179e2944180f2829df89096efdf13?pvs=4)に記載したAPIキーをコピーする。

3. `backend/.env` に以下を記載する。

```bash
GEMINI_API_KEY=XXXXXXXXXXXX
```

### コンテナの起動

1. ターミナルで以下を実行し、コンテナを起動する。

```bash
docker compose up
```

2. http://localhost:5173 にアクセスする。

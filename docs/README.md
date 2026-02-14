# Debug Master ドキュメント

Debug Master は、AI が生成した「わざとバグのあるコード」を修正することで、間違い探し感覚でプログラミングを学べる学習アプリです。京都大学の学生によって開発されました。

## ドキュメント一覧

| ドキュメント | 内容 |
|---|---|
| [architecture.md](./architecture.md) | 全体アーキテクチャ、技術スタック、ディレクトリ構成、ユーザーフロー |
| [frontend.md](./frontend.md) | フロントエンドの設計詳細（ルーティング、コンポーネント、フック） |
| [backend.md](./backend.md) | バックエンドの設計詳細（FastAPI、コード実行エンジン、データ層） |
| [api-reference.md](./api-reference.md) | 全 API エンドポイントのリファレンス |
| [data-model.md](./data-model.md) | データモデル定義（Python / TypeScript / JSON） |
| [ai-integration.md](./ai-integration.md) | Gemini AI 連携の仕組み（コード生成、ヒント、解説） |
| [setup.md](./setup.md) | 環境構築・デプロイ手順 |
| [agents.md](./agents.md) | Agents モジュール（Streamlit + Manim アニメーション生成） |

## クイックリンク

- **すぐに動かしたい** → [setup.md](./setup.md)
- **全体像を把握したい** → [architecture.md](./architecture.md)
- **API の仕様を確認したい** → [api-reference.md](./api-reference.md)
- **AI の仕組みを理解したい** → [ai-integration.md](./ai-integration.md)

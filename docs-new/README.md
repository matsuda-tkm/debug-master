# Debug Master クラウド化 改修計画ドキュメント

Debug Master を Google Cloud + Vercel 構成にリファクタ・クラウド化するための改修計画ドキュメントです。

> 現行仕様のドキュメントは [docs/](../docs/) を参照してください。

## ドキュメント一覧

| ドキュメント | 内容 |
|---|---|
| [migration-plan.md](./migration-plan.md) | 移行計画書（4 フェーズのタスク一覧・チェックリスト・依存関係） |
| [architecture.md](./architecture.md) | 新アーキテクチャ設計書（GCP + Vercel 構成図、データフロー、認証フロー） |
| [infrastructure.md](./infrastructure.md) | インフラ構成（GCP リソース一覧、環境分離、Cloud Run / Firestore / Vercel 設定） |
| [cicd.md](./cicd.md) | CI/CD パイプライン（GitHub Actions ワークフロー設計、YAML テンプレート） |
| [security.md](./security.md) | セキュリティ設計（Firebase Auth、Secret Manager、コード実行サンドボックス） |
| [database-migration.md](./database-migration.md) | DB 移行設計（JSON → Firestore のマッピング、移行スクリプト方針） |

## クイックリンク

- **移行の全体像を把握したい** → [migration-plan.md](./migration-plan.md)
- **新しいアーキテクチャを理解したい** → [architecture.md](./architecture.md)
- **GCP / Vercel のリソース構成を確認したい** → [infrastructure.md](./infrastructure.md)
- **デプロイの自動化を確認したい** → [cicd.md](./cicd.md)
- **認証・シークレット管理を確認したい** → [security.md](./security.md)
- **DB の移行方針を確認したい** → [database-migration.md](./database-migration.md)

## 移行の概要

### 現行構成

| レイヤー | 技術 |
|---|---|
| フロントエンド | React 18 + TypeScript + Vite (Docker) |
| バックエンド | Python 3.13 + FastAPI (Docker) |
| データ | JSON ファイル (`challenges.json`) |
| AI | Google Gemini API |
| 認証 | なし |
| デプロイ | Docker Compose (ローカル) |

### 移行先構成

| レイヤー | 技術 |
|---|---|
| フロントエンド | React + TypeScript + Vite → Vercel |
| バックエンド | Python + FastAPI → Google Cloud Run |
| データ | Cloud Firestore |
| AI | Google Gemini API (変更なし) |
| 認証 | Firebase Authentication (Google SSO) |
| シークレット管理 | Google Secret Manager |
| CI/CD | GitHub Actions |
| 環境 | prod (ローカル開発は Docker Compose) |

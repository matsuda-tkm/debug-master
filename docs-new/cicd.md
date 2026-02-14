# CI/CD パイプライン

## 概要

GitHub Actions を使用してバックエンドの自動テスト・デプロイを行う。フロントエンドは Vercel の GitHub 連携による自動デプロイを利用する。

## パイプライン全体像

```mermaid
flowchart TB
    subgraph trigger [トリガー]
        PR["PR 作成/更新"]
        Merge["main マージ"]
    end

    subgraph test [テスト]
        Lint["Lint + Type Check"]
        Build["ビルド確認"]
    end

    subgraph deployDev [dev デプロイ]
        DevBE["Backend → Cloud Run (dev)"]
        DevFE["Frontend → Vercel Preview"]
    end

    subgraph deployProd [prod デプロイ]
        ProdBE["Backend → Cloud Run (prod)"]
        ProdFE["Frontend → Vercel Production"]
    end

    PR --> Lint --> Build
    PR --> DevBE
    PR --> DevFE

    Merge --> Lint --> Build
    Merge --> ProdBE
    Merge --> ProdFE
```

## ワークフロー一覧

| ワークフロー | ファイル | トリガー | 内容 |
|---|---|---|---|
| テスト | `.github/workflows/test.yml` | PR, push to main | Lint、型チェック、ビルド確認 |
| バックエンドデプロイ (dev) | `.github/workflows/deploy-backend.yml` | PR to main | dev 環境への Cloud Run デプロイ |
| バックエンドデプロイ (prod) | `.github/workflows/deploy-backend.yml` | push to main | prod 環境への Cloud Run デプロイ |
| フロントエンドデプロイ | Vercel GitHub 連携 | PR / push to main | Preview / Production デプロイ |

---

## テストワークフロー

### `.github/workflows/test.yml`

```yaml
name: Test

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  frontend-lint:
    name: Frontend Lint & Build
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - run: npm ci
      - run: npm run lint
      - run: npm run build

  backend-lint:
    name: Backend Lint
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.13'
          cache: 'pip'
          cache-dependency-path: backend/requirements.txt

      - run: pip install ruff
      - run: ruff check .
```

---

## バックエンドデプロイワークフロー

### `.github/workflows/deploy-backend.yml`

```yaml
name: Deploy Backend

on:
  pull_request:
    branches: [main]
    paths:
      - 'backend/**'
  push:
    branches: [main]
    paths:
      - 'backend/**'

env:
  REGION: asia-northeast1
  SERVICE_NAME: debug-master-api
  REPOSITORY: debug-master

jobs:
  deploy-dev:
    name: Deploy to Dev
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    environment: dev
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER_DEV }}
          service_account: ${{ secrets.GCP_SA_EMAIL_DEV }}

      - uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev

      - name: Build and Push Docker Image
        run: |
          IMAGE=${{ env.REGION }}-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID_DEV }}/${{ env.REPOSITORY }}/api:dev-${{ github.sha }}
          docker build -t $IMAGE backend/
          docker push $IMAGE

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy ${{ env.SERVICE_NAME }}-dev \
            --image ${{ env.REGION }}-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID_DEV }}/${{ env.REPOSITORY }}/api:dev-${{ github.sha }} \
            --region ${{ env.REGION }} \
            --project ${{ secrets.GCP_PROJECT_ID_DEV }} \
            --platform managed \
            --allow-unauthenticated \
            --set-env-vars "ENVIRONMENT=dev,ALLOWED_ORIGINS=http://localhost:5173" \
            --set-secrets "GEMINI_API_KEY=gemini-api-key:latest"

  deploy-prod:
    name: Deploy to Prod
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER_PROD }}
          service_account: ${{ secrets.GCP_SA_EMAIL_PROD }}

      - uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev

      - name: Build and Push Docker Image
        run: |
          IMAGE=${{ env.REGION }}-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID_PROD }}/${{ env.REPOSITORY }}/api:prod-${{ github.sha }}
          docker build -t $IMAGE backend/
          docker push $IMAGE

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy ${{ env.SERVICE_NAME }}-prod \
            --image ${{ env.REGION }}-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID_PROD }}/${{ env.REPOSITORY }}/api:prod-${{ github.sha }} \
            --region ${{ env.REGION }} \
            --project ${{ secrets.GCP_PROJECT_ID_PROD }} \
            --platform managed \
            --allow-unauthenticated \
            --min-instances 1 \
            --max-instances 10 \
            --set-env-vars "ENVIRONMENT=prod,ALLOWED_ORIGINS=https://debug-master.vercel.app" \
            --set-secrets "GEMINI_API_KEY=gemini-api-key:latest"
```

---

## フロントエンドデプロイ (Vercel)

Vercel の GitHub 連携を使用し、ワークフローの作成は不要。

### 設定手順

1. Vercel ダッシュボードで「New Project」→ GitHub リポジトリを選択
2. Root Directory を `frontend/` に設定
3. Framework Preset を `Vite` に設定
4. 環境変数を設定

### デプロイフロー

| イベント | Vercel の挙動 |
|---|---|
| PR 作成/更新 | Preview デプロイ (一意の URL が発行される) |
| main マージ | Production デプロイ |

### 環境変数の設定

Vercel ダッシュボードの「Settings > Environment Variables」で設定する。

| 変数名 | Preview | Production |
|---|---|---|
| `VITE_API_BASE_URL` | Cloud Run dev URL | Cloud Run prod URL |
| `VITE_FIREBASE_API_KEY` | Firebase dev API キー | Firebase prod API キー |
| `VITE_FIREBASE_AUTH_DOMAIN` | dev ドメイン | prod ドメイン |
| `VITE_FIREBASE_PROJECT_ID` | dev プロジェクト ID | prod プロジェクト ID |

---

## GitHub Secrets / Variables の一覧

### GitHub Environments

2 つの Environment を作成する: `dev`, `production`

### dev 環境の Secrets

| シークレット名 | 説明 |
|---|---|
| `GCP_PROJECT_ID_DEV` | dev 用 GCP プロジェクト ID |
| `GCP_WORKLOAD_IDENTITY_PROVIDER_DEV` | Workload Identity Federation プロバイダ |
| `GCP_SA_EMAIL_DEV` | GitHub Actions 用サービスアカウントのメールアドレス |

### production 環境の Secrets

| シークレット名 | 説明 |
|---|---|
| `GCP_PROJECT_ID_PROD` | prod 用 GCP プロジェクト ID |
| `GCP_WORKLOAD_IDENTITY_PROVIDER_PROD` | Workload Identity Federation プロバイダ |
| `GCP_SA_EMAIL_PROD` | GitHub Actions 用サービスアカウントのメールアドレス |

### 認証方式: Workload Identity Federation

サービスアカウントキー JSON の管理を避けるため、Workload Identity Federation を使用する。

```mermaid
sequenceDiagram
    participant GHA as GitHub Actions
    participant WIF as Workload Identity Federation
    participant GCP as GCP APIs

    GHA->>WIF: OIDC トークンを提示
    WIF->>WIF: トークンを検証
    WIF-->>GHA: 短期アクセストークン
    GHA->>GCP: アクセストークンで API 呼び出し
```

#### セットアップ手順 (参考)

```bash
# Workload Identity Pool の作成
gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Workload Identity Provider の作成
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# サービスアカウントへのバインド
gcloud iam service-accounts add-iam-policy-binding \
  "github-actions@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/OWNER/REPO"
```

---

## GitHub Actions 用サービスアカウントの IAM ロール

| ロール | 目的 |
|---|---|
| `roles/run.developer` | Cloud Run サービスのデプロイ |
| `roles/artifactregistry.writer` | Docker イメージのプッシュ |
| `roles/iam.serviceAccountUser` | Cloud Run サービスアカウントの使用 |

---

## デプロイフロー (まとめ)

```mermaid
flowchart TD
    Dev["開発者"] -->|PR 作成| GitHub["GitHub"]

    GitHub -->|PR イベント| TestWF["test.yml<br>Lint + Build"]
    GitHub -->|PR イベント| DevBE["deploy-backend.yml<br>(dev job)"]
    GitHub -->|PR イベント| VercelPreview["Vercel<br>Preview Deploy"]

    GitHub -->|main マージ| TestWFProd["test.yml<br>Lint + Build"]
    GitHub -->|main マージ| ProdBE["deploy-backend.yml<br>(prod job)"]
    GitHub -->|main マージ| VercelProd["Vercel<br>Production Deploy"]

    DevBE --> DevCR["Cloud Run (dev)"]
    ProdBE --> ProdCR["Cloud Run (prod)"]
    VercelPreview --> Preview["Preview URL"]
    VercelProd --> Production["Production URL"]
```

## 関連ドキュメント

- 移行計画 → [migration-plan.md](./migration-plan.md)
- インフラ構成 → [infrastructure.md](./infrastructure.md)
- セキュリティ設計 → [security.md](./security.md)

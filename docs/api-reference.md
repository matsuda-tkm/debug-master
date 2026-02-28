# API リファレンス

ベース URL: `http://localhost:8000`

## エンドポイント一覧

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/health` | ヘルスチェック |
| GET | `/api/challenges` | 全チャレンジ取得 |
| GET | `/api/challenges/{id}` | チャレンジ個別取得 |
| POST | `/api/challenges` | チャレンジ作成 |
| PUT | `/api/challenges/{id}` | チャレンジ更新 |
| DELETE | `/api/challenges/{id}` | チャレンジ削除 |
| POST | `/api/run-python` | Python コード実行 (SSE) |
| POST | `/api/generate-code` | バグ入りコード生成 |
| POST | `/api/generate-hint` | ヒント生成 |
| POST | `/api/generate-explanation` | 成功時の解説生成 |
| POST | `/api/generate-retire-explanation` | リタイア時の解説生成 |

---

## ヘルスチェック

### `GET /api/health`

サーバーの稼働状態を確認します。

**レスポンス**

```json
{
  "status": "OK"
}
```

---

## チャレンジ CRUD

### `GET /api/challenges`

全チャレンジの一覧を取得します。

**レスポンス** (200)

```json
[
  {
    "id": "hello-world",
    "title": "はじめてのプログラム",
    "description": "自分の名前を表示するプログラムを作成します。",
    "difficulty": "入門",
    "image": "images/character.png?auto=format&fit=crop&w=800&q=80",
    "languages": ["Python"],
    "instructions": "...",
    "examples": "...",
    "video": "/videos/hello-world.mp4",
    "testCases": [
      { "input": "太郎", "expected": "こんにちは、太郎です！" }
    ]
  }
]
```

### `GET /api/challenges/{challenge_id}`

指定 ID のチャレンジを取得します。

**パスパラメータ**

| パラメータ | 型 | 説明 |
|---|---|---|
| `challenge_id` | string | チャレンジの一意な ID |

**レスポンス** (200) - 上記と同じ形式のオブジェクト

**エラー** (404)

```json
{
  "detail": "Challenge with ID 'xxx' not found"
}
```

### `POST /api/challenges`

チャレンジを新規作成します。

**リクエストボディ**

```json
{
  "id": "new-challenge",
  "title": "新しいチャレンジ",
  "description": "説明文",
  "difficulty": "初級",
  "image": "images/new.png",
  "languages": ["Python"],
  "instructions": "問題の仕様",
  "examples": "入出力例",
  "video": "/videos/new.mp4",
  "testCases": [
    { "input": "test", "expected": "expected_output" }
  ]
}
```

**レスポンス** (201) - 作成されたチャレンジオブジェクト

**エラー**

| ステータス | 説明 |
|---|---|
| 400 | 必須フィールドが不足 |
| 409 | 同じ ID が既に存在 |

### `PUT /api/challenges/{challenge_id}`

既存のチャレンジを更新します。

**パスパラメータ**

| パラメータ | 型 | 説明 |
|---|---|---|
| `challenge_id` | string | 更新対象のチャレンジ ID |

**リクエストボディ** - `POST` と同じ形式（`id` フィールドは不要、パスの ID が使用される）

**レスポンス** (200) - 更新されたチャレンジオブジェクト

**エラー** (404) - 指定 ID のチャレンジが存在しない

### `DELETE /api/challenges/{challenge_id}`

チャレンジを削除します。

**レスポンス** (200)

```json
{
  "message": "Challenge with ID 'hello-world' deleted successfully"
}
```

**エラー** (404) - 指定 ID のチャレンジが存在しない

---

## コード実行

### `POST /api/run-python`

ユーザーの Python コードを実行し、テスト結果を **SSE (Server-Sent Events)** でストリーミング返却します。

**リクエストボディ**

```json
{
  "code": "test_cases = ['太郎']\nfor i, input_value in enumerate(test_cases, start=1):\n    print(f\"---- テストケース{i} ----\")\n    print(f\"こんにちは、{input_value}です！\")",
  "testCases": [
    { "input": "太郎", "expected": "こんにちは、太郎です！" }
  ]
}
```

**レスポンス** (`text/event-stream`)

成功時:

```
data: {"testCase": 1, "status": "success", "input": "太郎", "expected_output": "こんにちは、太郎です！", "actual_output": "こんにちは、太郎です！"}
```

失敗時:

```
data: {"testCase": 1, "status": "error", "input": "太郎", "expected_output": "こんにちは、太郎です！", "actual_output": "こんにちは、太郎です。"}
```

禁止文字列検出時:

```
data: {"status": "forbidden", "message": "Execution halted: Code contains forbidden string 'GEMINI_API_KEY'."}
```

---

## AI 生成

### `POST /api/generate-code`

Gemini API を使って、意図的にバグを含むコードを生成します。

**リクエストボディ**

```json
{
  "challenge": "自分の名前を「こんにちは、〇〇です！」の形で表示する関数を作成してください。",
  "testCases": [
    { "input": "太郎", "expected": "こんにちは、太郎です！" },
    { "input": "花子", "expected": "こんにちは、花子です！" }
  ]
}
```

**レスポンス** (200)

```json
{
  "code": "def main(name):\n    return f\"こんにちは、{name}です。\"",
  "explanation": "句読点が「！」ではなく「。」になっています。"
}
```

**エラーレスポンス** (200)

```json
{
  "error": "全ての生成コードがテストに成功してしまいました。別の難易度を選択するか、プロンプトを調整してください。"
}
```

### `POST /api/generate-hint`

学生のコードとテスト結果に基づいて、4 段階のヒントを生成します。

**リクエストボディ**

```json
{
  "code": "def main(name):\n    return f\"こんにちは、{name}です。\"",
  "instructions": "自分の名前を「こんにちは、〇〇です！」の形で表示する関数を作成してください。",
  "examples": "例: main(\"太郎\") → こんにちは、太郎です！",
  "testResults": [
    { "status": "error", "message": "expected: こんにちは、太郎です！ actual: こんにちは、太郎です。" }
  ]
}
```

**レスポンス** (200)

```json
{
  "hints": [
    { "level": 1, "title": "方向性", "content": "出力の末尾に注目してみましょう。" },
    { "level": 2, "title": "キーワード", "content": "句読点の種類を確認しましょう。" },
    { "level": 3, "title": "骨子", "content": "文字列の最後の文字が「。」になっていないか確認しましょう。" },
    { "level": 4, "title": "最終ヒント", "content": "「。」を「！」に変更する必要があります。" }
  ]
}
```

### `POST /api/generate-explanation`

成功時に、修正前後のコードを比較した解説を生成します。

**リクエストボディ**

```json
{
  "beforeCode": "def main(name):\n    return f\"こんにちは、{name}です。\"",
  "afterCode": "def main(name):\n    return f\"こんにちは、{name}です！\"",
  "instructions": "...",
  "examples": "...",
  "testResults": [
    { "status": "success", "message": "" }
  ]
}
```

**レスポンス** (200)

```json
{
  "reason": "句読点が「。」になっていたため、期待される出力と一致しませんでした。",
  "explain_diff": "・return文の文末を「。」から「！」に変更しました。"
}
```

### `POST /api/generate-retire-explanation`

リタイア時に、正解コードと励ましのフィードバックを生成します。

**リクエストボディ** - `generate-explanation` と同じ形式

**レスポンス** (200)

```json
{
  "answer_code": "def main(name):\n    print(f\"こんにちは、{name}です！\")",
  "explanation": "この問題は、print関数を使って挨拶文を表示するものでした。...",
  "advice": "焦らず、一つずつ確認していけば大丈夫です！..."
}
```

---

## 関連ドキュメント

- バックエンドの実装詳細 → [backend.md](./backend.md)
- データモデル → [data-model.md](./data-model.md)
- AI 連携の仕組み → [ai-integration.md](./ai-integration.md)

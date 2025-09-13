# Debug Master

## 概要

京大生が開発した新感覚プログラミング学習アプリDebug Master。AI生成のわざと間違えたコードを修正することで、間違い探しのように楽しくプログラミングを学べます。従来の「1から書く」学習よりハードルが低く、初心者でも気軽に体験可能！

## 実績

- [Open Hack U 2025 OSAKA](https://hacku.yahoo.co.jp/hacku2025_osaka/)
- [千代田区立麹町中学校 プログラミング部（KJHS-PC）](https://manju-s-6271.github.io/KJHS-PC/)

## 実行方法

### APIキーの設定

1. `backend/.env` を作成する。

2. [Google AI Studio](https://aistudio.google.com/app/apikey) でAPIキーを取得する。

3. `backend/.env` に取得したAPIキーを以下のように記載する。

```bash
GEMINI_API_KEY=XXXXXXXXXXXX
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

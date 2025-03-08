# openHackU-Osaka2025
Open Hack U 2025 OSAKA

## 環境構築の方法
### フロントエンド
ターミナルで以下を順に実行する。

1. Dockerコンテナを起動。
```bash
docker compose up -d
```

2. フロントエンドコンテナのbashに入る。
```bash
docker compose exec frontend bash
```

3. 入ったら以下を実行してサーバーを起動する。
```bash
npm run dev
```

4. `localhost:5173`にアクセスして、ページが表示されることを確認する。

5. サーバーを停止するには`Ctrl`+`C`を同時に押す。

6. コンテナのbashから抜けるには以下を実行する。
```bash
exit
```

7. Dockerコンテナを停止するには以下を実行する。
```bash
docker compose down
```



### バックエンド
ターミナルで以下を順に実行する。

1. Dockerコンテナを起動。（フロントの環境構築時に起動済みの場合は不要）

2. バックエンドコンテナのbashに入る。
```bash
docker compose exec backend bash
```

3. 以下を実行。
```bash
python hello.py
# 出力： Hello, Bug Gym!
```

4. コンテナのbashから抜けるには以下を実行する。
```bash
exit
```

5. Dockerコンテナを停止するには以下を実行する。
```bash
docker compose down
```
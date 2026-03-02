# 手順1:
# backend/open-hacku-2025-oak-a35383cc3876.json
# 上記のファイルを作成し、Firestore のサービスアカウント鍵を保存する。
# ※ 必ず .gitignore に追加し、鍵情報を GitHub に公開しないこと。

# 手順2:
# 実行時はコマンド引数 --env で環境を指定する。
# ・--env dev   → 開発環境へ書き込み
# ・--env prod  → 本番環境へ書き込み
# 環境を誤ると本番データを書き換える可能性があるため、
# 実行前に指定した環境を必ず確認すること。

# 実行コマンド:
# 開発環境へ書き込み
# python frontend/src/migrate_to_firestore.py --env dev
# 本番環境へ書き込み
# python frontend/src/migrate_to_firestore.py --env prod

#!/usr/bin/env python3
import argparse
import json
import re
from pathlib import Path
from typing import Any, List
from google.cloud import firestore as g_firestore
from google.oauth2 import service_account

DATABASE_ID = "debug-master"
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parents[1]

JSON_PATH = PROJECT_ROOT / "backend" / "database" / "data" / "challenges.json"
SERVICE_ACCOUNT_PATH = PROJECT_ROOT / "backend" / "open-hacku-2025-oak-a35383cc3876.json"

# -------------------------
# 環境切り替え（--env）
# -------------------------
parser = argparse.ArgumentParser()
parser.add_argument(
    "--env",
    choices=["dev", "prod"],
    required=True,
    help="実行環境を指定"
)
args = parser.parse_args()

if args.env == "dev":
    COLLECTION_NAME = "test_challenges"
elif args.env == "prod":
    COLLECTION_NAME = "challenges"
if not JSON_PATH.exists():
    raise FileNotFoundError(f"{JSON_PATH} が見つかりません")

def load_challenges_from_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def normalize_string(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def normalize_languages(value: Any) -> List[str]:
    if isinstance(value, list):
        return [str(v) for v in value if v]
    if isinstance(value, str):
        return [value]
    return []


def normalize_testcases(testcases: Any) -> List[dict]:
    normalized = []

    if not isinstance(testcases, list):
        return normalized

    for tc in testcases:
        input_value = tc.get("input")

        if isinstance(input_value, list):
            input_value = [str(v) for v in input_value]
        elif input_value is None:
            input_value = []
        else:
            input_value = [str(input_value)]

        normalized.append({
            "input": input_value,
            "expected": normalize_string(tc.get("expected")),
        })

    return normalized


def normalize_challenge(ch: dict) -> dict:
    return {
        "id": normalize_string(ch.get("id")),
        "title": normalize_string(ch.get("title")),
        "description": normalize_string(ch.get("description")),
        "difficulty": normalize_string(ch.get("difficulty")),
        "image": normalize_string(ch.get("image")),
        "instructions": normalize_string(ch.get("instructions")),
        "examples": normalize_string(ch.get("examples")),
        "languages": normalize_languages(ch.get("languages")),
        "video": normalize_string(ch.get("video")),
        "testCases": normalize_testcases(ch.get("testCases")),
    }


def init_firestore(service_account_path: Path):
    creds = service_account.Credentials.from_service_account_file(
        str(service_account_path)
    )

    project_id = creds.project_id

    return g_firestore.Client(
        project=project_id,
        credentials=creds,
        database=DATABASE_ID,
    )


def migrate(db, challenges):
    for ch in challenges:
        doc_id = ch["id"]
        data = normalize_challenge(ch)

        db.collection(COLLECTION_NAME).document(doc_id).set(data)
        print("written:", doc_id)


if __name__ == "__main__":
    print("environment:", args.env)
    print("collection:", COLLECTION_NAME)

    if not SERVICE_ACCOUNT_PATH.exists():
        raise FileNotFoundError(f"{SERVICE_ACCOUNT_PATH} が見つかりません")

    if not JSON_PATH.exists():
        raise FileNotFoundError(f"{JSON_PATH} が見つかりません")

    challenges = load_challenges_from_json(JSON_PATH)
    db = init_firestore(SERVICE_ACCOUNT_PATH)
    migrate(db, challenges)
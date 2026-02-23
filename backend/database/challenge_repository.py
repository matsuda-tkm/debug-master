import json
import os
from typing import Protocol

import config
from database.models.challenge import Challenge

from google.cloud import firestore
from google.oauth2 import service_account


def _build_firestore_client(
    project_id: str,
    credentials_path: str,
    database_id: str,
) -> firestore.Client:
    if not os.path.exists(credentials_path):
        raise ValueError(
            f"FIRESTORE_CREDENTIALS_PATH does not exist: {credentials_path}"
        )
    credentials = service_account.Credentials.from_service_account_file(credentials_path)

    return firestore.Client(
        project=project_id,
        credentials=credentials,
        database=database_id,
    )


class ChallengeRepository(Protocol):
    def get_all_challenges(self) -> list[Challenge]:
        raise NotImplementedError

    def get_challenge_by_id(self, challenge_id: str) -> Challenge | None:
        raise NotImplementedError

    def create_challenge(self, challenge: Challenge) -> Challenge:
        raise NotImplementedError

    def update_challenge(self, challenge_id: str, challenge: Challenge) -> Challenge | None:
        raise NotImplementedError

    def delete_challenge(self, challenge_id: str) -> bool:
        raise NotImplementedError


class JsonChallengeRepository:
    def __init__(self, data_file_path: str = "database/data/challenges.json"):
        self.data_file_path = data_file_path
        self._ensure_data_file_exists()

    def _ensure_data_file_exists(self) -> None:
        if not os.path.exists(self.data_file_path):
            os.makedirs(os.path.dirname(self.data_file_path), exist_ok=True)
            with open(self.data_file_path, 'w', encoding='utf-8') as file:
                json.dump([], file, ensure_ascii=False, indent=2)

    def _load_challenges(self) -> list[dict[str, object]]:
        try:
            with open(self.data_file_path, 'r', encoding='utf-8') as file:
                raw_data = json.load(file)
                if not isinstance(raw_data, list):
                    return []
                loaded_data: list[dict[str, object]] = []
                for item in raw_data:
                    if isinstance(item, dict):
                        parsed_item: dict[str, object] = {}
                        for key, value in item.items():
                            if isinstance(key, str):
                                parsed_item[key] = value
                        loaded_data.append(parsed_item)
                return loaded_data
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    def _save_challenges(self, challenges_data: list[dict[str, object]]) -> None:
        with open(self.data_file_path, 'w', encoding='utf-8') as file:
            json.dump(challenges_data, file, ensure_ascii=False, indent=2)

    def get_all_challenges(self) -> list[Challenge]:
        challenges_data = self._load_challenges()
        return [Challenge.from_dict(data) for data in challenges_data]

    def get_challenge_by_id(self, challenge_id: str) -> Challenge | None:
        challenges_data = self._load_challenges()
        for data in challenges_data:
            if data["id"] == challenge_id:
                return Challenge.from_dict(data)
        return None

    def create_challenge(self, challenge: Challenge) -> Challenge:
        challenges_data = self._load_challenges()
        
        # Check if challenge with same ID already exists
        if any(c["id"] == challenge.id for c in challenges_data):
            raise ValueError(f"Challenge with ID '{challenge.id}' already exists")

        challenge_data: dict[str, object] = {
            key: value for key, value in challenge.to_dict().items()
        }
        challenges_data.append(challenge_data)
        self._save_challenges(challenges_data)
        return challenge

    def update_challenge(self, challenge_id: str, challenge: Challenge) -> Challenge | None:
        challenges_data = self._load_challenges()
        
        for i, data in enumerate(challenges_data):
            if data["id"] == challenge_id:
                # Update the ID to match the provided ID
                challenge.id = challenge_id
                challenge_data: dict[str, object] = {
                    key: value for key, value in challenge.to_dict().items()
                }
                challenges_data[i] = challenge_data
                self._save_challenges(challenges_data)
                return challenge
        
        return None

    def delete_challenge(self, challenge_id: str) -> bool:
        challenges_data = self._load_challenges()
        
        for i, data in enumerate(challenges_data):
            if data["id"] == challenge_id:
                challenges_data.pop(i)
                self._save_challenges(challenges_data)
                return True
        
        return False


class FirestoreChallengeRepository:
    def __init__(
        self,
        client: firestore.Client,
        collection_name: str,
    ):
        self.client = client
        self.collection = self.client.collection(collection_name)

    def get_all_challenges(self) -> list[Challenge]:
        challenges: list[Challenge] = []
        for doc in self.collection.stream():
            data = doc.to_dict() or {}
            if "id" not in data:
                data["id"] = doc.id
            challenges.append(Challenge.from_dict(data))
        return challenges

    def get_challenge_by_id(self, challenge_id: str) -> Challenge | None:
        doc = self.collection.document(challenge_id).get()
        if not doc.exists:
            return None
        data = doc.to_dict() or {}
        if "id" not in data:
            data["id"] = doc.id
        print(data)
        return Challenge.from_dict(data)

    def create_challenge(self, challenge: Challenge) -> Challenge:
        doc_ref = self.collection.document(challenge.id)
        if doc_ref.get().exists:
            raise ValueError(f"Challenge with ID '{challenge.id}' already exists")
        doc_ref.set(challenge.to_dict())
        return challenge

    def update_challenge(self, challenge_id: str, challenge: Challenge) -> Challenge | None:
        doc_ref = self.collection.document(challenge_id)
        if not doc_ref.get().exists:
            return None
        challenge.id = challenge_id
        doc_ref.set(challenge.to_dict())
        return challenge

    def delete_challenge(self, challenge_id: str) -> bool:
        doc_ref = self.collection.document(challenge_id)
        if not doc_ref.get().exists:
            return False
        doc_ref.delete()
        return True


def build_challenge_repository() -> ChallengeRepository:
    source = config.CHALLENGE_REPOSITORY
    if source is None:
        raise ValueError("CHALLENGE_REPOSITORY must be set in config")

    if source == "firestore":
        project_id = config.FIRESTORE_PROJECT_ID
        collection_name = config.FIRESTORE_COLLECTION
        credentials_path = config.FIRESTORE_CREDENTIALS_PATH
        database_id = config.FIRESTORE_DATABASE_ID

        assert project_id is not None, "FIRESTORE_PROJECT_ID must be set when using firestore repository"
        assert credentials_path is not None, "FIRESTORE_CREDENTIALS_PATH must be set when using firestore repository"
        assert database_id is not None, "FIRESTORE_DATABASE_ID must be set when using firestore repository"
        assert collection_name is not None, "FIRESTORE_COLLECTION must be set when using firestore repository"

        client = _build_firestore_client(project_id, credentials_path, database_id)
        return FirestoreChallengeRepository(client=client, collection_name=collection_name)

    raise ValueError(f"Unsupported challenge repository: {source}")

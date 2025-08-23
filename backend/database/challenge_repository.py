import json
import os
from typing import List, Optional, Dict, Any
from database.models.challenge import Challenge


class ChallengeRepository:
    def __init__(self, data_file_path: str = "database/data/challenges.json"):
        self.data_file_path = data_file_path
        self._ensure_data_file_exists()

    def _ensure_data_file_exists(self) -> None:
        if not os.path.exists(self.data_file_path):
            os.makedirs(os.path.dirname(self.data_file_path), exist_ok=True)
            with open(self.data_file_path, 'w', encoding='utf-8') as file:
                json.dump([], file, ensure_ascii=False, indent=2)

    def _load_challenges(self) -> List[Dict[str, Any]]:
        try:
            with open(self.data_file_path, 'r', encoding='utf-8') as file:
                return json.load(file)
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    def _save_challenges(self, challenges_data: List[Dict[str, Any]]) -> None:
        with open(self.data_file_path, 'w', encoding='utf-8') as file:
            json.dump(challenges_data, file, ensure_ascii=False, indent=2)

    def get_all_challenges(self) -> List[Challenge]:
        challenges_data = self._load_challenges()
        return [Challenge.from_dict(data) for data in challenges_data]

    def get_challenge_by_id(self, challenge_id: str) -> Optional[Challenge]:
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
        
        challenges_data.append(challenge.to_dict())
        self._save_challenges(challenges_data)
        return challenge

    def update_challenge(self, challenge_id: str, challenge: Challenge) -> Optional[Challenge]:
        challenges_data = self._load_challenges()
        
        for i, data in enumerate(challenges_data):
            if data["id"] == challenge_id:
                # Update the ID to match the provided ID
                challenge.id = challenge_id
                challenges_data[i] = challenge.to_dict()
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
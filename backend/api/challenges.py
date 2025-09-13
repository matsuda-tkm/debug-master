from http import HTTPStatus
from typing import Dict, Any
from database.challenge_repository import ChallengeRepository
from database.models.challenge import Challenge


class ChallengesAPIHandler:
    def __init__(self):
        self.repository = ChallengeRepository()

    def handle_get_challenges(self, path: str) -> Dict[str, Any]:
        try:
            if path == "/api/challenges":
                # Get all challenges
                challenges = self.repository.get_all_challenges()
                return {
                    "status": HTTPStatus.OK,
                    "data": [challenge.to_dict() for challenge in challenges]
                }
            elif path.startswith("/api/challenges/"):
                # Get specific challenge by ID
                challenge_id = path.split("/")[-1]
                challenge = self.repository.get_challenge_by_id(challenge_id)
                if challenge:
                    return {
                        "status": HTTPStatus.OK,
                        "data": challenge.to_dict()
                    }
                else:
                    return {
                        "status": HTTPStatus.NOT_FOUND,
                        "error": f"Challenge with ID '{challenge_id}' not found"
                    }
            else:
                return {
                    "status": HTTPStatus.NOT_FOUND,
                    "error": "API endpoint not found"
                }
        except Exception as e:
            return {
                "status": HTTPStatus.INTERNAL_SERVER_ERROR,
                "error": f"Internal server error: {str(e)}"
            }

    def handle_post_challenge(self, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            # Validate required fields
            required_fields = ["id", "title", "description", "difficulty", "image", 
                             "languages", "instructions", "examples", "video", "testCases"]
            
            for field in required_fields:
                if field not in data:
                    return {
                        "status": HTTPStatus.BAD_REQUEST,
                        "error": f"Missing required field: {field}"
                    }

            # Create Challenge object
            challenge = Challenge.from_dict(data)
            
            # Save to repository
            created_challenge = self.repository.create_challenge(challenge)
            
            return {
                "status": HTTPStatus.CREATED,
                "data": created_challenge.to_dict()
            }
        
        except ValueError as e:
            return {
                "status": HTTPStatus.CONFLICT,
                "error": str(e)
            }
        except Exception as e:
            return {
                "status": HTTPStatus.INTERNAL_SERVER_ERROR,
                "error": f"Internal server error: {str(e)}"
            }

    def handle_put_challenge(self, challenge_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            # Validate required fields
            required_fields = ["title", "description", "difficulty", "image", 
                             "languages", "instructions", "examples", "video", "testCases"]
            
            for field in required_fields:
                if field not in data:
                    return {
                        "status": HTTPStatus.BAD_REQUEST,
                        "error": f"Missing required field: {field}"
                    }

            # Ensure ID is set correctly
            data["id"] = challenge_id
            
            # Create Challenge object
            challenge = Challenge.from_dict(data)
            
            # Update in repository
            updated_challenge = self.repository.update_challenge(challenge_id, challenge)
            
            if updated_challenge:
                return {
                    "status": HTTPStatus.OK,
                    "data": updated_challenge.to_dict()
                }
            else:
                return {
                    "status": HTTPStatus.NOT_FOUND,
                    "error": f"Challenge with ID '{challenge_id}' not found"
                }
        
        except Exception as e:
            return {
                "status": HTTPStatus.INTERNAL_SERVER_ERROR,
                "error": f"Internal server error: {str(e)}"
            }

    def handle_delete_challenge(self, challenge_id: str) -> Dict[str, Any]:
        try:
            success = self.repository.delete_challenge(challenge_id)
            
            if success:
                return {
                    "status": HTTPStatus.OK,
                    "message": f"Challenge with ID '{challenge_id}' deleted successfully"
                }
            else:
                return {
                    "status": HTTPStatus.NOT_FOUND,
                    "error": f"Challenge with ID '{challenge_id}' not found"
                }
        
        except Exception as e:
            return {
                "status": HTTPStatus.INTERNAL_SERVER_ERROR,
                "error": f"Internal server error: {str(e)}"
            }
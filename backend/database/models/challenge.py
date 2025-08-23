from dataclasses import dataclass
from typing import List, Any, Dict


@dataclass
class TestCase:
    input: List[Any]
    expected: Any

    def to_dict(self) -> Dict[str, Any]:
        return {
            "input": self.input,
            "expected": self.expected
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "TestCase":
        return cls(
            input=data["input"],
            expected=data["expected"]
        )


@dataclass
class Challenge:
    id: str
    title: str
    description: str
    difficulty: str
    image: str
    languages: List[str]
    instructions: str
    examples: str
    video: str
    testCases: List[TestCase]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "difficulty": self.difficulty,
            "image": self.image,
            "languages": self.languages,
            "instructions": self.instructions,
            "examples": self.examples,
            "video": self.video,
            "testCases": [test_case.to_dict() for test_case in self.testCases]
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Challenge":
        return cls(
            id=data["id"],
            title=data["title"],
            description=data["description"],
            difficulty=data["difficulty"],
            image=data["image"],
            languages=data["languages"],
            instructions=data["instructions"],
            examples=data["examples"],
            video=data["video"],
            testCases=[TestCase.from_dict(tc) for tc in data["testCases"]]
        )
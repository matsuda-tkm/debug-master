import json
import random
from typing import Any, Dict, List, Callable

from google import genai
from google.genai import types

import config

client = genai.Client(api_key=config.GEMINI_API_KEY)


def generate_code_logic(
    prompt_str: str,
    test_cases: List[Dict[str, Any]],
    fn_test_code_against_all_cases: Callable[[str, List[Dict[str, Any]]], bool],
) -> Dict[str, str]:
    response = client.models.generate_content(
        model="gemini-2.0-flash",  # Consider making model name a config variable
        contents=[prompt_str],
        config=types.GenerateContentConfig(
            temperature=0.5,  # Consider making temperature a config variable
            system_instruction=config.SYSTEM_INSTRUNCTION,
            response_mime_type="application/json",
        ),
    )
    print(
        f"Gemini API response for code generation: {response.text[:500]}..."  # type: ignore
    )  # Log snippet

    try:
        response_json: Dict[str, Any] = json.loads(response.text)  # type: ignore
    except json.JSONDecodeError as e:
        print(f"JSONDecodeError in generate_code_logic: {e}")
        print(f"Response text was: {response.text}")
        raise  # Re-raise to be caught by handler

    if not test_cases:
        if not response_json.get(
            "content"
        ):  # Handle cases where content might be missing
            return {"error": "生成されたコードが空です。プロンプトを確認してください。"}
        selected_idx: int = random.randint(0, len(response_json["content"]) - 1)
        generated_code: str = response_json["content"][selected_idx]["code"]
        explanation: str = response_json["content"][selected_idx]["explanation"]
        return {"code": generated_code, "explanation": explanation}

    if not response_json.get("content"):
        return {"error": "生成されたコードが空です。プロンプトを確認してください。"}

    for idx in range(len(response_json["content"])):
        item = response_json["content"][idx]
        code = item.get("code")
        explanation = item.get("explanation")

        if not code:  # Skip if code is missing for an item
            print(f"Warning: Missing code in generated content item {idx}")
            continue

        all_tests_pass = fn_test_code_against_all_cases(code, test_cases)

        if not all_tests_pass:
            print(f"Selected code (failed at least one test case):\n```\n{code}\n```")
            return {"code": code, "explanation": explanation}

    print(
        "All generated codes passed all test cases. This might indicate an issue or easy problem."
    )
    # Fallback: return the first generated code if all pass, or an error as per original logic
    # Original logic returns an error, so we stick to that.
    return {
        "error": "全ての生成コードがテストに成功してしまいました。別の難易度を選択するか、プロンプトを調整してください。"
    }


def generate_hint_logic(
    code: str, instructions: str, examples: str, test_results: List[Dict[str, Any]]
) -> str:
    test_results_text = ""
    for i, result in enumerate(test_results):
        status = "成功" if result.get("status") == "success" else "失敗"
        test_results_text += f"テストケース {i + 1}: {status}\n"
        # Ensure message is a string, provide default if missing
        message = result.get("message", "")
        if not isinstance(message, str):
            message = str(message)  # Convert to string if it's not
        test_results_text += f"メッセージ: {message}\n\n"

    prompt = f"""
課題:
{instructions}

例:
{examples}

学生のコード:
{code}

テスト結果:
{test_results_text}
"""
    response = client.models.generate_content(
        model="gemini-2.0-flash",  # Consider making model name a config variable
        contents=[prompt],
        config=types.GenerateContentConfig(
            temperature=0.0,  # Consider making temperature a config variable
            system_instruction=config.HINT_SYSTEM_INSTRUCTION,
        ),
    )
    return response.text  # type: ignore

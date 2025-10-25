import json
import random
import re
import textwrap
from typing import Any, Callable, Dict, List, Optional

import config
from google import genai
from google.genai import types

client = genai.Client(api_key=config.GEMINI_API_KEY)

INLINE_CODE_PATTERN = re.compile(r"(^|[^`])`([^`\n]+)`(?!`)")
TRIPLE_BACKTICK_PATTERN = re.compile(r"```([a-zA-Z0-9_-]+)?\s*\n?([\s\S]*?)```", re.MULTILINE)


def _normalize_hint_content(text: str) -> str:
    if not text:
        return ""

    normalized = text.replace("\r\n", "\n")

    code_blocks: List[str] = []

    def _extract_block(match: re.Match[str]) -> str:
        language = (match.group(1) or "").strip()
        body = match.group(2) or ""
        body = re.sub(r"^\n+", "", body)
        body = re.sub(r"\n+$", "", body)

        header = f"```{language}\n" if language else "```\n"
        block = f"{header}{body}\n```"

        placeholder = f"__CODE_BLOCK_{len(code_blocks)}__"
        code_blocks.append(block)
        return placeholder

    normalized = TRIPLE_BACKTICK_PATTERN.sub(_extract_block, normalized)

    def _replace_inline(match: re.Match[str]) -> str:
        prefix, code = match.groups()
        trimmed = code.strip()
        if not trimmed:
            return match.group(0)
        return f"{prefix}``{trimmed}``"

    normalized = INLINE_CODE_PATTERN.sub(_replace_inline, normalized)

    for index, block in enumerate(code_blocks):
        placeholder = f"__CODE_BLOCK_{index}__"
        normalized = normalized.replace(placeholder, block, 1)

    return normalized.strip()


def _iter_json_candidates(raw_text: str) -> List[str]:
    candidates: List[str] = []

    stripped = raw_text.strip()
    if stripped:
        candidates.append(stripped)

    fenced_match = TRIPLE_BACKTICK_PATTERN.search(raw_text)
    if fenced_match:
        body = (fenced_match.group(2) or "").strip()
        if body:
            candidates.append(body)

    object_match = re.search(r"\{[\s\S]*\}", raw_text)
    if object_match:
        guessed = object_match.group(0).strip()
        if guessed and guessed not in candidates:
            candidates.append(guessed)

    array_match = re.search(r"\[[\s\S]*\]", raw_text)
    if array_match:
        guessed = array_match.group(0).strip()
        if guessed and guessed not in candidates:
            candidates.append(guessed)

    return candidates


def _load_hint_payload(raw_text: str) -> Optional[Dict[str, Any]]:
    for candidate in _iter_json_candidates(raw_text):
        try:
            loaded = json.loads(candidate)
        except json.JSONDecodeError:
            continue

        if isinstance(loaded, dict):
            return loaded

        if isinstance(loaded, list):
            return {"levels": loaded}

    return None


def generate_code_logic(
    prompt_str: str,
    test_cases: List[Dict[str, Any]],
    fn_test_code_against_all_cases: Callable[[str, List[Dict[str, Any]]], bool],
) -> Dict[str, str]:
    response = client.models.generate_content(
        model=config.GEMINI_MODEL_NAME,
        contents=[prompt_str],
        config=types.GenerateContentConfig(
            temperature=config.GEMINI_TEMPERATURE,
            system_instruction=config.SYSTEM_INSTRUCTION,
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


def _build_test_results_summary(test_results: List[Dict[str, Any]]) -> str:
    summary = ""
    for i, result in enumerate(test_results):
        status = "成功" if result.get("status") == "success" else "失敗"
        summary += f"テストケース {i + 1}: {status}\n"
        message = result.get("message", "")
        if not isinstance(message, str):
            message = str(message)
        summary += f"メッセージ: {message}\n\n"
    return summary


def _parse_hint_levels(raw_text: str) -> List[Dict[str, Any]]:
    payload = _load_hint_payload(raw_text)
    if payload is None:
        return [
            {
                "level": 1,
                "title": "ヒント",
                "content": _normalize_hint_content(raw_text),
            }
        ]

    levels = payload.get("levels")
    if not isinstance(levels, list) or not levels:
        levels = payload.get("hints")

    if not isinstance(levels, list) or not levels:
        return [
            {
                "level": 1,
                "title": "ヒント",
                "content": _normalize_hint_content(raw_text),
            }
        ]

    parsed_levels: List[Dict[str, Any]] = []
    for item in levels:
        if not isinstance(item, dict):
            continue
        level = item.get("level")
        content = item.get("content")
        title = item.get("title")
        if level is None or content is None:
            continue
        parsed_levels.append(
            {
                "level": int(level),
                "title": str(title) if title is not None else "",
                "content": _normalize_hint_content(str(content)),
            }
        )

    parsed_levels.sort(key=lambda x: x["level"])
    return parsed_levels if parsed_levels else [
        {
            "level": 1,
            "title": "ヒント",
            "content": _normalize_hint_content(raw_text),
        }
    ]


def generate_hint_logic(
    code: str, instructions: str, examples: str, test_results: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    test_results_text = _build_test_results_summary(test_results)

    prompt_template = textwrap.dedent(
        """
        課題:
        {instructions}

        例:
        {examples}

        学生のコード:
        {code}

        テスト結果:
        {test_results_text}

        レベル1からレベル4まで段階的に情報量が増えるヒントを作成してください。各レベルの目的は以下です。
        - レベル1: 解決への方向性や観察すべきポイントを短く提示する。
        - レベル2: 具体的なキーワード、関連する定理やアプローチ名を示す。
        - レベル3: 解法の大まかな手順や必要な式・疑似コードの骨子を説明する。
        - レベル4: ほぼ答えに近い形で具体的な対処法や境界条件を提示する。

        以下のJSON形式のみで出力してください（コードブロックは不要です）。
        {{
          "levels": [
            {{"level": 1, "title": "方向性", "content": "..."}},
            {{"level": 2, "title": "キーワード", "content": "..."}},
            {{"level": 3, "title": "骨子", "content": "..."}},
            {{"level": 4, "title": "最終ヒント", "content": "..."}}
          ]
        }}

        タイトルは任意で調整しても構いませんが、各レベルの粒度が段階的に深まるようにしてください。
        ヒント本文内でコードや識別子を示す場合は、インラインなら ``example``、複数行のコードは ```python\n...\n``` のようにバッククォートでマークアップしてください。
        ヒント本文内で改行が必要な場合は、実際の改行ではなく文字列として "\\n" を挿入してください。
        """
    )

    prompt = prompt_template.format(
        instructions=instructions,
        examples=examples,
        code=code,
        test_results_text=test_results_text,
    )

    response = client.models.generate_content(
        model="gemini-2.0-flash",  # Consider making model name a config variable
        contents=[prompt],
        config=types.GenerateContentConfig(
            temperature=0.0,  # Consider making temperature a config variable
            system_instruction=config.HINT_SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
        ),
    )

    return _parse_hint_levels(response.text)  # type: ignore


def _summarize_test_results(test_results: List[Dict[str, Any]]) -> str:
    text = ""
    for i, result in enumerate(test_results):
        status = "成功" if result.get("status") == "success" else "失敗"
        message = result.get("message", "")
        if not isinstance(message, str):
            message = str(message)
        text += f"テストケース {i + 1}: {status}\nメッセージ: {message}\n\n"
    return text


def generate_explanation_logic(
    before_code: str,
    after_code: str,
    instructions: str,
    examples: str,
    test_results: List[Dict[str, Any]],
) -> Dict[str, Any]:
    test_results_text = _summarize_test_results(test_results)
    prompt = f"""
課題:
{instructions}

例:
{examples}

Before (修正前のコード):
{before_code}

After (修正後のコード):
{after_code}

テスト結果サマリ:
{test_results_text}
"""
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[prompt],
        config=types.GenerateContentConfig(
            temperature=0.2,
            system_instruction=config.EXPLANATION_SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
        ),
    )
    # Ensure valid JSON
    try:
        return json.loads(response.text)  # type: ignore[arg-type]
    except Exception as e:
        # Fallback: wrap raw text
        return {
            "reason": "解説の生成に失敗しました。",
            "explain_diff": "解説の生成に失敗しました。",
            "raw": getattr(response, "text", str(e)),
        }


def generate_retire_explanation_logic(
    before_code: str,
    after_code: str,
    instructions: str,
    examples: str,
    test_results: List[Dict[str, Any]],
) -> Dict[str, Any]:
    test_results_text = _summarize_test_results(test_results)
    prompt = f"""
課題の説明:
{instructions}

例:
{examples}

AI生成コード（学習者が修正の出発点としたコード）:
```python
{before_code}
```

学習者の最新コード（学習者が修正を試みた後のコード）:
```python
{after_code}
```

テスト結果:
{test_results_text}
"""
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[prompt],
        config=types.GenerateContentConfig(
            temperature=0.15,
            system_instruction=config.RETIRE_SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
        ),
    )
    try:
        return json.loads(response.text)  # type: ignore[arg-type]
    except Exception as e:
        return {
            "reason": "リタイア解説の生成に失敗しました。",
            "explain_diff": "リタイア解説の生成に失敗しました。",
            "raw": getattr(response, "text", str(e)),
        }

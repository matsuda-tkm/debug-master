import io
import re
import traceback
from contextlib import redirect_stdout
from typing import Any, Dict, List

TESTCASE_MARKER_PATTERN = re.compile(r"----\s*テストケース\s*(\d+)\s*----")


def _split_output_by_markers(output: str, expected_cases: int) -> Dict[int, str] | str:
    if expected_cases == 0:
        return {}
    matches = list(TESTCASE_MARKER_PATTERN.finditer(output))
    if not matches:
        return "---- テストケース1 ----が検出されませんでした"

    segments: Dict[int, str] = {}
    for idx, match in enumerate(matches):
        case_number = int(match.group(1))
        start = match.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(output)
        segments[case_number] = output[start:end].strip()

    for i in range(1, expected_cases + 1):
        if i not in segments:
            return f"---- テストケース{i} ----が検出されませんでした"

    return segments


def run_all_test_cases(code: str, test_cases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    stdout_capture: io.StringIO = io.StringIO()
    try:
        namespace: Dict[str, Any] = {"__name__": "__main__"}

        with redirect_stdout(stdout_capture):
            exec(code, namespace)

        full_output = stdout_capture.getvalue()
        split_result = _split_output_by_markers(full_output, len(test_cases))

        if isinstance(split_result, str):
            return [
                {
                    "status": "error",
                    "message": split_result,
                    "input": test_case.get("input"),
                    "expected_output": str(test_case.get("expected")).strip(),
                    "actual_output": "",
                }
                for test_case in test_cases
            ]

        results: List[Dict[str, Any]] = []
        for idx, test_case in enumerate(test_cases, start=1):
            expected_output = str(test_case.get("expected")).strip()
            actual_output = split_result.get(idx, "")
            status = "success" if actual_output == expected_output else "error"
            results.append(
                {
                    "status": status,
                    "input": test_case.get("input"),
                    "expected_output": expected_output,
                    "actual_output": actual_output,
                }
            )
        return results

    except Exception as e:
        return [
            {
                "status": "error",
                "message": f"Error during execution:\n\n{str(e)}\n{traceback.format_exc()}",
            }
        ]


def run_single_test_case(code: str, test_case: Dict[str, Any]) -> Dict[str, Any]:
    # Kept for backward compatibility; now simply runs all tests and returns the first result.
    results = run_all_test_cases(code, [test_case])
    return results[0]


def test_code_against_all_cases(code: str, test_cases: List[Dict[str, Any]]) -> bool:
    if not test_cases:
        return True
    results = run_all_test_cases(code, test_cases)
    return all(result.get("status") == "success" for result in results)

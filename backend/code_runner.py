import builtins
import io
import re
import signal
import traceback
from contextlib import contextmanager
from contextlib import redirect_stdout
from typing import Any, Dict, List, Sequence

TESTCASE_MARKER_PATTERN = re.compile(r"----\s*テストケース\s*(\d+)\s*----")
EXECUTION_TIMEOUT_SECONDS = 10
MAX_STDOUT_BYTES = 1024 * 1024  # 1MB

FORBIDDEN_PATTERNS: Sequence[tuple[re.Pattern[str], str]] = (
    (re.compile(r"(^|\n)\s*import\s+os\b"), "import os は許可されていません"),
    (re.compile(r"(^|\n)\s*import\s+subprocess\b"), "import subprocess は許可されていません"),
    (re.compile(r"(^|\n)\s*import\s+sys\b"), "import sys は許可されていません"),
    (re.compile(r"(^|\n)\s*from\s+os\s+import\b"), "from os import ... は許可されていません"),
    (
        re.compile(r"(^|\n)\s*from\s+subprocess\s+import\b"),
        "from subprocess import ... は許可されていません",
    ),
    (re.compile(r"(^|\n)\s*from\s+sys\s+import\b"), "from sys import ... は許可されていません"),
    (re.compile(r"\b__import__\s*\("), "__import__() は許可されていません"),
    (re.compile(r"\beval\s*\("), "eval() は許可されていません"),
    (re.compile(r"\bexec\s*\("), "exec() は許可されていません"),
    (re.compile(r"\bopen\s*\("), "open() は許可されていません"),
    (re.compile(r"\bglobals\s*\("), "globals() は許可されていません"),
    (re.compile(r"\blocals\s*\("), "locals() は許可されていません"),
    (re.compile(r"\bgetattr\s*\("), "getattr() は許可されていません"),
    (re.compile(r"\bsetattr\s*\("), "setattr() は許可されていません"),
)

SAFE_BUILTINS: Dict[str, Any] = {
    "__build_class__": builtins.__build_class__,
    "Exception": builtins.Exception,
    "ValueError": builtins.ValueError,
    "TypeError": builtins.TypeError,
    "RuntimeError": builtins.RuntimeError,
    "ZeroDivisionError": builtins.ZeroDivisionError,
    "IndexError": builtins.IndexError,
    "KeyError": builtins.KeyError,
    "isinstance": builtins.isinstance,
    "issubclass": builtins.issubclass,
    "iter": builtins.iter,
    "next": builtins.next,
    "map": builtins.map,
    "filter": builtins.filter,
    "abs": builtins.abs,
    "all": builtins.all,
    "any": builtins.any,
    "bool": builtins.bool,
    "chr": builtins.chr,
    "dict": builtins.dict,
    "enumerate": builtins.enumerate,
    "float": builtins.float,
    "int": builtins.int,
    "len": builtins.len,
    "list": builtins.list,
    "max": builtins.max,
    "min": builtins.min,
    "ord": builtins.ord,
    "pow": builtins.pow,
    "print": builtins.print,
    "range": builtins.range,
    "reversed": builtins.reversed,
    "round": builtins.round,
    "set": builtins.set,
    "sorted": builtins.sorted,
    "str": builtins.str,
    "sum": builtins.sum,
    "tuple": builtins.tuple,
    "zip": builtins.zip,
}


class CodeExecutionTimeoutError(Exception):
    pass


class StdoutLimitExceededError(Exception):
    pass


class LimitedStdoutCapture(io.TextIOBase):
    def __init__(self, limit_bytes: int):
        self._limit_bytes = limit_bytes
        self._size_bytes = 0
        self._parts: List[str] = []

    def write(self, s: str) -> int:
        if not isinstance(s, str):
            s = str(s)
        next_size = self._size_bytes + len(s.encode("utf-8"))
        if next_size > self._limit_bytes:
            raise StdoutLimitExceededError(f"標準出力は最大 {self._limit_bytes} bytes までです")
        self._parts.append(s)
        self._size_bytes = next_size
        return len(s)

    def flush(self) -> None:
        return None

    def getvalue(self) -> str:
        return "".join(self._parts)


@contextmanager
def _execution_timeout(seconds: int):
    def _handle_timeout(signum: int, frame: Any) -> None:
        raise CodeExecutionTimeoutError(f"実行が {seconds} 秒を超えたため中断しました")

    previous_handler = signal.getsignal(signal.SIGALRM)
    try:
        signal.signal(signal.SIGALRM, _handle_timeout)
        signal.alarm(seconds)
        yield
    finally:
        signal.alarm(0)
        signal.signal(signal.SIGALRM, previous_handler)


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


def _find_forbidden_reason(code: str) -> str | None:
    for pattern, message in FORBIDDEN_PATTERNS:
        if pattern.search(code):
            return message
    return None


def _build_error_results(message: str, test_cases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not test_cases:
        return [{"status": "error", "message": message}]
    return [
        {
            "status": "error",
            "message": message,
            "input": test_case.get("input"),
            "expected_output": str(test_case.get("expected")).strip(),
            "actual_output": "",
        }
        for test_case in test_cases
    ]


def run_all_test_cases(code: str, test_cases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    forbidden_reason = _find_forbidden_reason(code)
    if forbidden_reason:
        return _build_error_results(
            f"このアプリでは使えない書き方が見つかりました。{forbidden_reason}",
            test_cases,
        )

    stdout_capture = LimitedStdoutCapture(limit_bytes=MAX_STDOUT_BYTES)
    try:
        namespace: Dict[str, Any] = {"__name__": "__main__", "__builtins__": SAFE_BUILTINS}

        with redirect_stdout(stdout_capture):
            with _execution_timeout(EXECUTION_TIMEOUT_SECONDS):
                exec(code, namespace)

        full_output = stdout_capture.getvalue()
        split_result = _split_output_by_markers(full_output, len(test_cases))

        if isinstance(split_result, str):
            return _build_error_results(split_result, test_cases)

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

    except CodeExecutionTimeoutError as e:
        return _build_error_results(str(e), test_cases)
    except StdoutLimitExceededError as e:
        return _build_error_results(f"出力制限エラー: {str(e)}", test_cases)
    except Exception as e:
        return _build_error_results(
            f"Error during execution:\n\n{str(e)}\n{traceback.format_exc()}",
            test_cases,
        )


def run_single_test_case(code: str, test_case: Dict[str, Any]) -> Dict[str, Any]:
    # Kept for backward compatibility; now simply runs all tests and returns the first result.
    results = run_all_test_cases(code, [test_case])
    return results[0]


def test_code_against_all_cases(code: str, test_cases: List[Dict[str, Any]]) -> bool:
    if not test_cases:
        return True
    results = run_all_test_cases(code, test_cases)
    return all(result.get("status") == "success" for result in results)

import io
import traceback
from contextlib import redirect_stdout
from copy import deepcopy
from typing import Any, Dict, List


def run_single_test_case(code: str, test_case: Dict[str, Any]) -> Dict[str, Any]:
    stdout_capture: io.StringIO = io.StringIO()  # Renamed to avoid conflict
    try:
        namespace: Dict[str, Any] = {}
        # It's generally safer to provide a restricted globals dictionary
        # For now, using an empty one as in the original code.
        exec(code, namespace)
        solution = namespace.get("main")

        if not callable(solution):  # Check if 'main' is a function
            return {
                "status": "error",
                "message": f'Function "main" not found or not callable in code. Found: {type(solution)}',
            }

        with redirect_stdout(stdout_capture):
            # Ensure input_data is a list of arguments for splatting
            input_data_orig = test_case.get("input", [])
            if not isinstance(input_data_orig, list):
                # If input is not a list, wrap it in a list, assuming it's a single arg
                # This might need adjustment based on expected input structure
                input_data_list = [input_data_orig]
            else:
                input_data_list = input_data_orig

            input_data = deepcopy(input_data_list)
            result = solution(*input_data)

        expected = test_case.get("expected")
        # Robust comparison: type and value
        if type(result) is type(expected) and result == expected:
            return {
                "status": "success",
                "message": f"Input:\n{'\n'.join(map(str, input_data_list))}\n\nExpected:\n{expected}\n\nGot:\n{result}",
            }
        else:
            return {
                "status": "error",
                "message": f"Input:\n{'\n'.join(map(str, input_data_list))}\n\nExpected:\n{expected} (type: {type(expected)})\n\nGot:\n{result} (type: {type(result)})",
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error during execution:\n\n{str(e)}\n{traceback.format_exc()}",
        }


def test_code_against_all_cases(code: str, test_cases: List[Dict[str, Any]]) -> bool:
    if not test_cases:  # If there are no test cases, consider it as passing
        return True
    for test_case in test_cases:
        result = run_single_test_case(code, test_case)
        if result.get("status") != "success":
            return False
    return True

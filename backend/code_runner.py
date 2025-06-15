import io
import traceback
from contextlib import redirect_stdout
from copy import deepcopy
from typing import Any, Dict, List


def run_single_test_case(code: str, test_case: Dict[str, Any]) -> Dict[str, Any]:
    stdout_capture: io.StringIO = io.StringIO()
    try:
        namespace: Dict[str, Any] = {}
        
        with redirect_stdout(stdout_capture):
            # Ensure input_data is a list of arguments for splatting
            input_data_orig = test_case.get("input", [])
            if not isinstance(input_data_orig, list):
                input_data_list = [input_data_orig]
            else:
                input_data_list = input_data_orig

            input_data = deepcopy(input_data_list)
            
            # Execute the code and check if main function exists
            exec(code, namespace)
            solution = namespace.get("main")

            if not callable(solution):
                return {
                    "status": "error",
                    "message": f'Function "main" not found or not callable in code. Found: {type(solution)}',
                }
            
            # Call the main function (this will produce output via print statements)
            solution(*input_data)

        # Get the captured output and strip trailing whitespace/newlines
        actual_output = stdout_capture.getvalue().strip()
        expected_output = str(test_case.get("expected")).strip()
        
        # Compare the outputs
        if actual_output == expected_output:
            return {
                "status": "success",
                "message": f"Input:\n{'\n'.join(map(str, input_data_list))}\n\nExpected output:\n{expected_output}\n\nActual output:\n{actual_output}",
            }
        else:
            return {
                "status": "error",
                "message": f"Input:\n{'\n'.join(map(str, input_data_list))}\n\nExpected output:\n{expected_output}\n\nActual output:\n{actual_output}",
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

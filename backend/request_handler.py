import http.server
import json
import traceback
from http import HTTPStatus
from typing import Any, Dict, List

from code_runner import run_single_test_case, test_code_against_all_cases
from gemini_utils import generate_code_logic, generate_hint_logic


class TestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path == "/api/health":
            self.send_json_response({"status": "OK"})
            return
        # For serving static files if needed, or a 404 for other GET requests
        # super().do_GET() # If you have static files in the same directory
        self.send_error(HTTPStatus.NOT_FOUND, "File Not Found")

    def do_POST(self) -> None:
        try:
            if self.path == "/api/run-python":
                data_run: Dict[str, Any] = self.parse_json_from_request()
                code: str = data_run.get("code", "")
                test_cases: List[Dict[str, Any]] = data_run.get("testCases", [])

                self.send_sse_headers()
                self.run_tests_with_sse(code, test_cases)
                return

            elif self.path == "/api/generate-code":
                data_gen: Dict[str, Any] = self.parse_json_from_request()
                challenge = data_gen.get("challenge", "")
                test_cases = data_gen.get("testCases", [])
                prompt = f"""\
Problem description:
{challenge}
                """
                result: Dict[str, str] = generate_code_logic(
                    prompt, test_cases, test_code_against_all_cases
                )
                self.send_json_response(result)
                return

            elif self.path == "/api/generate-hint":
                data: Dict[str, Any] = self.parse_json_from_request()
                code: str = data.get("code", "")
                instructions: str = data.get("instructions", "")
                examples: str = data.get(
                    "examples", ""
                )  # Ensure this is passed correctly
                test_results: List[Dict[str, Any]] = data.get("testResults", [])

                hint: str = generate_hint_logic(
                    code, instructions, examples, test_results
                )
                self.send_json_response({"hint": hint})
                return

            self.send_error(HTTPStatus.NOT_FOUND, "API endpoint not found")
        except json.JSONDecodeError as e:
            self.send_json_response(
                {"error": f"Invalid JSON in request: {str(e)}"}, HTTPStatus.BAD_REQUEST
            )
        except Exception as e:
            print(f"Unhandled exception in POST: {e}\n{traceback.format_exc()}")
            self.send_json_response(
                {"error": f"Internal server error: {str(e)}"},
                HTTPStatus.INTERNAL_SERVER_ERROR,
            )

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.set_cors_headers()
        self.end_headers()

    def parse_json_from_request(self) -> Dict[str, Any]:
        content_length: int = int(self.headers.get("Content-Length", 0))
        if content_length == 0:
            return {}
        post_data: bytes = self.rfile.read(content_length)
        return json.loads(post_data.decode("utf-8"))

    def send_json_response(
        self, data: Dict[str, Any], status: int = HTTPStatus.OK
    ) -> None:
        self.send_response(status)
        self.set_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        response_body: str = json.dumps(data)
        self.wfile.write(response_body.encode("utf-8"))

    def send_sse_headers(self) -> None:
        self.send_response(HTTPStatus.OK)
        self.set_cors_headers()
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")  # Important for SSE
        self.end_headers()

    def set_cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def write_sse_data(self, data: str) -> None:
        try:
            self.wfile.write(f"data: {data}\n\n".encode("utf-8"))
            self.wfile.flush()
        except BrokenPipeError:
            print("SSE client disconnected.")
        except Exception as e:
            print(f"Error writing SSE data: {e}")

    def run_tests_with_sse(self, code: str, test_cases: List[Dict[str, Any]]) -> None:
        if "GEMINI_API_KEY" in code:  # Basic security check
            error_response = json.dumps(
                {
                    "status": "forbidden",
                    "message": "Execution halted: Code contains forbidden string 'GEMINI_API_KEY'.",
                }
            )
            self.write_sse_data(error_response)
            return

        for i, test_case in enumerate(test_cases):
            result: Dict[str, Any] = run_single_test_case(code, test_case)
            response_data: str = json.dumps(
                {
                    "status": "ok",  # This outer status indicates SSE event sent ok
                    "testCaseNumber": i + 1,  # Use a distinct key
                    **result,  # Spread the actual test result (which has its own 'status')
                }
            )
            self.write_sse_data(response_data)

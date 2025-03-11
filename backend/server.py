import http.server
import io
import json
import socketserver
import traceback
from contextlib import redirect_stdout
from http import HTTPStatus


class TestHandler(http.server.SimpleHTTPRequestHandler):
    """
    A handler that provides:
      - /api/health                (GET)
      - /api/run-python            (POST)
      - /api/generate-code         (POST)
      - CORS preflight handling    (OPTIONS)
    """

    def do_GET(self):
        if self.path == "/api/health":
            self.send_json_response({"status": "OK"})
            return
        return super().do_GET()

    def do_POST(self):
        if self.path == "/api/run-python":
            data = self.parse_json_from_request()
            code = data.get("code", "")
            self.send_sse_headers()

            test_cases = self.get_test_cases()
            self.run_tests_with_sse(code, test_cases)
            return

        elif self.path == "/api/generate-code":
            data = self.parse_json_from_request()
            prompt = data.get("prompt", "")

            generated_code = self.generate_code_from_prompt(prompt)
            self.send_json_response({"code": generated_code})
            return

        # それ以外のパスに対しては 404 を返す
        self.send_error(HTTPStatus.NOT_FOUND, "Not Found")

    def do_OPTIONS(self):
        """
        CORS preflight request handler
        """
        self.send_response(HTTPStatus.NO_CONTENT)
        self.set_cors_headers()
        self.end_headers()

    # ---------------------------
    # Common utility / helper methods
    # ---------------------------

    def parse_json_from_request(self):
        """
        POSTデータを読み取り、JSONオブジェクトとして返す
        """
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)
        return json.loads(post_data.decode("utf-8"))

    def send_json_response(self, data, status=HTTPStatus.OK):
        """
        JSON形式のレスポンスを返す
        """
        self.send_response(status)
        self.set_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()

        response = json.dumps(data)
        self.wfile.write(response.encode("utf-8"))

    def send_sse_headers(self):
        """
        SSE (Server-Sent Events) 向けのヘッダを送信する
        """
        self.send_response(HTTPStatus.OK)
        self.set_cors_headers()
        self.send_header("Content-Type", "text/event-stream")
        self.end_headers()

    def set_cors_headers(self):
        """
        CORS用の共通ヘッダを設定する
        """
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    # ---------------------------
    # /api/generate-code endpoint logic
    # ---------------------------

    def generate_code_from_prompt(self, prompt):
        """
        受け取ったプロンプトに応じてコードを生成する処理
        （サンプルとしてsumを返す）
        """
        generated_code = (
            "def solution(numbers):\n"
            f"    # Generated code based on prompt: {prompt}\n"
            "    return sum(numbers)"
        )
        return generated_code

    # ---------------------------
    # /api/run-python endpoint logic
    # ---------------------------

    def get_test_cases(self):
        """
        テストケースを定義して返す
        """
        return [
            {"input": ([1, 2, 3],), "expected": 6},
            {"input": ([],), "expected": 0},
            {"input": ([5],), "expected": 5},
            {"input": ([-1, -2, -3],), "expected": -6},
        ]

    def run_tests_with_sse(self, code, test_cases):
        """
        渡されたコードをテストケースごとに実行し、その結果をSSEで返す
        """
        for i, test_case in enumerate(test_cases):
            result = self.run_single_test_case(code, test_case)
            response = json.dumps({"testCase": i + 1, **result})
            self.write_sse_data(response)

    def run_single_test_case(self, code, test_case):
        """
        単一のテストケースを実行して結果を返す
        """
        stdout = io.StringIO()
        try:
            # Create a new namespace for each test
            namespace = {}

            # Execute the user's code in the namespace
            exec(code, namespace)

            # Get the solution function from the namespace
            solution = namespace.get("main")
            if not solution:
                return {
                    "status": "error",
                    "message": 'Function "main" not found in code',
                }

            # Capture stdout and run the test
            with redirect_stdout(stdout):
                result = solution(*test_case["input"])

            if result == test_case["expected"]:
                return {
                    "status": "success",
                    "message": (
                        f"Test passed! "
                        f'Input: {test_case["input"]}, '
                        f'Expected: {test_case["expected"]}, '
                        f"Got: {result}"
                    ),
                }
            else:
                return {
                    "status": "error",
                    "message": (
                        f"Test failed! "
                        f'Input: {test_case["input"]}, '
                        f'Expected: {test_case["expected"]}, '
                        f"Got: {result}"
                    ),
                }

        except Exception as e:
            return {
                "status": "error",
                "message": f"Error: {str(e)}\n{traceback.format_exc()}",
            }

    def write_sse_data(self, data):
        """
        SSE形式でクライアントへデータを送信する
        """
        self.wfile.write(f"data: {data}\n\n".encode("utf-8"))
        self.wfile.flush()


if __name__ == "__main__":
    PORT = 8000
    with socketserver.TCPServer(("", PORT), TestHandler) as httpd:
        print(f"Server running on port {PORT}")
        httpd.serve_forever()

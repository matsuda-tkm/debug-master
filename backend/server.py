import http.server
import socketserver
import json
import io
import sys
from contextlib import redirect_stdout
import traceback
from urllib.parse import parse_qs
from http import HTTPStatus

class TestHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/run-python':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            code = data.get('code', '')
            
            # Set CORS headers
            self.send_response(HTTPStatus.OK)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.send_header('Content-Type', 'text/event-stream')
            self.end_headers()

            # Define test cases
            test_cases = [
                {'input': ([1, 2, 3],), 'expected': 6},
                {'input': ([],), 'expected': 0},
                {'input': ([5],), 'expected': 5},
                {'input': ([-1, -2, -3],), 'expected': -6},
            ]
            
            for i, test_case in enumerate(test_cases):
                result = self.run_test_case(code, test_case)
                response = json.dumps({'testCase': i + 1, **result})
                self.wfile.write(f"data: {response}\n\n".encode('utf-8'))
                self.wfile.flush()

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def run_test_case(self, code, test_case):
        stdout = io.StringIO()
        
        try:
            # Create a new namespace for each test
            namespace = {}
            
            # Execute the user's code in the namespace
            exec(code, namespace)
            
            # Get the solution function from the namespace
            solution = namespace.get('solution')
            if not solution:
                return {
                    'status': 'error',
                    'message': 'Function "solution" not found in code'
                }
            
            # Capture stdout and run the test
            with redirect_stdout(stdout):
                result = solution(*test_case['input'])
                
            if result == test_case['expected']:
                return {
                    'status': 'success',
                    'message': f'Test passed! Input: {test_case["input"]}, Expected: {test_case["expected"]}, Got: {result}'
                }
            else:
                return {
                    'status': 'error',
                    'message': f'Test failed! Input: {test_case["input"]}, Expected: {test_case["expected"]}, Got: {result}'
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Error: {str(e)}\n{traceback.format_exc()}'
            }

if __name__ == '__main__':
    PORT = 8000
    Handler = TestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Server running on port {PORT}")
        httpd.serve_forever()
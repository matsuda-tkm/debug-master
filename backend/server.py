from flask import Flask, request, Response
from flask_cors import CORS
import time
import json

app = Flask(__name__)
CORS(app,
    # localhost:3000 is the default address of React's development server
    # Allow requests from the development server to the Flask server
    origins=['http://localhost:5173'],
    # Allow cookies to be sent with requests
    supports_credentials=True,
    methods=['GET', 'POST', 'PUT', 'DELETE']
)

@app.route('/', methods=['GET'])
def welcome():
    return 'Welcome to Code Generation API!'

@app.route('/api/health', methods=['GET'])
def health():
    return {
        'status': 'healthy'
    }

@app.route('/api/generate', methods=['POST'])
def generate_code():
    data = request.json
    prompt = data.get('prompt')
    language = data.get('language')
    
    def generate():
        # Simulate streaming response
        if language == 'python':
            code_lines = [
                "def calculate_sum(numbers):\n",
                "    # Initialize sum to 0\n",
                "    total = 0\n",
                "    \n",
                "    # Iterate through numbers\n",
                "    for num in numbers:\n",
                "        total += num\n",
                "    \n",
                "    return total\n"
            ]
        else:
            code_lines = [
                "function calculateSum(numbers) {\n",
                "  // Initialize sum to 0\n",
                "  let total = 0;\n",
                "  \n",
                "  // Iterate through numbers\n",
                "  for (const num of numbers) {\n",
                "    total += num;\n",
                "  }\n",
                "  \n",
                "  return total;\n",
                "}\n"
            ]
        
        for line in code_lines:
            time.sleep(0.1)  # Simulate thinking/generation time
            yield f"data: {json.dumps({'content': line})}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
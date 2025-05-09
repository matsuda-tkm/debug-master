import socketserver
from request_handler import TestHandler
from config import PORT

if __name__ == "__main__":
    # Allow address reuse, good for development
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), TestHandler) as httpd:
        print(f"Server running on port {PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer shutting down.")
            httpd.shutdown()

import http.server
import socketserver
import sys

# Default port 8000, but allows fallback or custom
PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Disable caching for easier development
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()

socketserver.TCPServer.allow_reuse_address = True

def run_server(port):
    try:
        with socketserver.TCPServer(("", port), Handler) as httpd:
            print(f"Serving at http://localhost:{port}")
            print("Press Ctrl+C to stop")
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 10048: # Address already in use
            print(f"Port {port} is busy. Trying {port+1}...")
            run_server(port + 1)
        else:
            print(f"Error: {e}")

if __name__ == "__main__":
    run_server(PORT)

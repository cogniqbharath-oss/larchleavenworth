import http.server
import socketserver

import json
import urllib.request
import urllib.error
import os

# Default port 8000
PORT = 8000

# --- CONFIGURATION ---
# REPLACE THIS WITH YOUR ACTUAL GEMINI API KEY
GEMINI_API_KEY = "AIzaSyCl_-Se613qrZ2IbPhP34npaKZDn4hUnjw" 
MODEL_ID = "gemma-3-27b-it" # or gemma-2-27b-it if available, using 1.5 flash for reliability

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Disable caching
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/worker':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                user_message = data.get('message', '')
                
                system_prompt = data.get('systemPrompt', "You are a helpful AI assistant.")
                
                # Call Gemini API
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_ID}:generateContent?key={GEMINI_API_KEY}"
                
                payload = {
                    "contents": [{
                        "role": "user",
                        "parts": [{"text": system_prompt + "\n\nUser: " + user_message + "\nConcierge:"}]
                    }],
                    "generationConfig": {
                        "maxOutputTokens": 150,
                        "temperature": 0.7
                    }
                }
                
                req = urllib.request.Request(
                    url, 
                    data=json.dumps(payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json'}
                )
                
                with urllib.request.urlopen(req) as response:
                    api_response = json.loads(response.read().decode('utf-8'))
                    text = api_response.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', "I'm sorry, I couldn't generate a response.")
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'response': text}).encode('utf-8'))

            except Exception as e:
                print(f"Error handling request: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        # Fallback to default handler for static files
        return super().do_GET() # SimpleHTTPRequestHandler doesn't have do_POST by default, so we don't call super().do_POST()

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

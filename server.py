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
GEMINI_API_KEY = "YOUR_GEMINI_API_KEY" 
MODEL_ID = "gemini-1.5-flash" # or gemma-2-27b-it if available, using 1.5 flash for reliability

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
        if self.path == '/api/chat':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                user_message = data.get('message', '')
                
                # System Prompt
                system_prompt = """You are the friendly and knowledgeable digital concierge for Larch Leavenworth, a premium restaurant in Leavenworth, WA.
      
      Your tone is: Warm, rustic-elegant, helpful, and concise.
      
      Context needed to answer questions:
      - Location: 10173 Titus Rd, Leavenworth, WA 98826.
      - Main offerings: Handcrafted Pasta, Cocktails, Bar, Dinner.
      - Vibe: Modern rustic, upscale but cozy, seasonal Northwest ingredients.
      - Reservations: We use Resy for online reservations. It's highly recommended as we book out fast.
      - Phone: (509) 398-3330
      - Email: larchgmanager@gmail.com
      - Instagram: @larch_leavenworth
      - Hours: Open Daily 4:00 PM - 9:00 PM. Happy Hour 4pm - 5pm.
      
      Instructions:
      - Answer the user's question directly.
      - If they ask for a table, direct them to the "Book a Table" button or mention Resy clearly.
      - If unsure, suggest they call the number or email. NEVER guess.
      - Keep responses short (under 3 sentences usually).
      
      Visuals:
      - If the user asks for pictures of food, pasta, cocktails, or the interior, append a specific tag to the end of your response.
      - Tags available: [SHOW_IMAGES: PASTA], [SHOW_IMAGES: COCKTAILS], [SHOW_IMAGES: INTERIOR], [SHOW_IMAGES: SPECIALS].
      - Example: "Here is a look at our handcrafted pasta! [SHOW_IMAGES: PASTA]"
      """

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

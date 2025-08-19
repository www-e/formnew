import http.server
import socketserver
import json
import os
import datetime

PORT = 8000
DIRECTORY = "."  # Serve from the current directory (project root)
BACKUP_DIR = "backup" # Relative to the project root

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/backup":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                
                # Ensure backup directory exists
                if not os.path.exists(BACKUP_DIR):
                    os.makedirs(BACKUP_DIR)

                timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                backup_filename = f"backup_{timestamp}.json"
                backup_filepath = os.path.join(BACKUP_DIR, backup_filename)

                with open(backup_filepath, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "message": "Backup created"}).encode('utf-8'))
                print(f"✅ Backup created: {backup_filepath}")
            except json.JSONDecodeError:
                self.send_response(400)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": "Invalid JSON"}).encode('utf-8'))
                print("❌ Invalid JSON received for backup.")
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": f"Server error: {str(e)}"}).encode('utf-8'))
                print(f"❌ Server error during backup: {e}")
        else:
            super().do_POST() # Handle other POST requests if any

    def do_GET(self):
        # Serve static files
        super().do_GET()

with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    print(f"Serving at port {PORT}")
    print(f"Open your browser to http://localhost:{PORT}/index.html")
    httpd.serve_forever()

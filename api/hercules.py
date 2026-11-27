"""POST /api/hercules : body is the obfuscated script (text). Static analysis only; nothing is stored."""
import json
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "_hercules"))
from deobfhercules import deobfuscate  # noqa: E402

MAX_BYTES = 1_000_000


class handler(BaseHTTPRequestHandler):
    def _reply(self, status, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self._reply(200, {"ok": True, "service": "hercules", "runtime": "python " + sys.version.split()[0]})

    def do_POST(self):
        try:
            size = int(self.headers.get("Content-Length", ""))
        except ValueError:
            return self._reply(411, {"ok": False, "error": "Missing content length."})
        if size <= 0:
            return self._reply(400, {"ok": False, "error": "The script is empty."})
        if size > MAX_BYTES:
            return self._reply(413, {"ok": False, "error": "The script is larger than 1 MB."})
        try:
            source = self.rfile.read(size).decode("utf-8", errors="replace")
            result = deobfuscate(source, prefer="decompiled")
            if not result.success:
                message = (result.error or "This payload is not supported.").splitlines()[0][:300]
                return self._reply(422, {"ok": False, "error": message})
            notes = ["Result type: " + result.mode + ". It may differ from the original source."]
            if result.error:
                notes.append("The main decompiler failed and a fallback was used.")
            return self._reply(200, {"ok": True, "code": result.output, "notes": notes})
        except Exception:
            return self._reply(500, {"ok": False, "error": "The script could not be processed."})

    def log_message(self, *args):
        pass
      

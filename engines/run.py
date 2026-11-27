"""Glue between the web worker and deobfhercules. Expects SOURCE (str); returns a JSON string."""
import json

from deobfhercules import deobfuscate


def run(source):
    try:
        result = deobfuscate(source, prefer="decompiled")
    except RecursionError:
        return json.dumps({"ok": False, "error": "The script is too deeply nested for browser mode."})
    except Exception:
        return json.dumps({"ok": False, "error": "The script could not be processed."})
    if not result.success:
        lines = (result.error or "This payload is not supported.").splitlines()
        return json.dumps({"ok": False, "error": lines[0][:300]})
    notes = ["Result type: " + result.mode + ". It may differ from the original source."]
    if result.error:
        notes.append("The main decompiler failed and a fallback was used.")
    return json.dumps({"ok": True, "code": result.output, "notes": notes})


run(SOURCE)

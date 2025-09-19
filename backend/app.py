import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

# ----------------- API Key Setup -----------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
    except Exception as e:
        print("❌ Error initializing Gemini model:", e)
        model = None
else:
    print("⚠️ WARNING: GEMINI_API_KEY not set. AI features will be disabled.")
    model = None


# ----------------- Ask AI -----------------
@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()
    question = data.get("question", "")

    if not question:
        return jsonify({"error": "No question provided"}), 400

    if model is None:
        return jsonify({"answer": "AI not configured. Please set GEMINI_API_KEY."})

    try:
        response = model.generate_content(question)
        return jsonify({"answer": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ----------------- Generate Project -----------------
@app.route("/generate", methods=["POST"])
def generate():
    if model is None:
        # fallback with demo project
        return jsonify({
            "files": {
                "index.html": "<!DOCTYPE html>\n<html>\n<head><title>Demo</title></head>\n<body>\n<h1>Hello</h1>\n</body>\n</html>",
                "style.css": "body { background: #f0f0f0; font-family: Arial; }",
                "script.js": "console.log('Hello World');",
                "README.md": "# Demo Project\nGenerated without AI (fallback)."
            }
        })

    try:
        prompt = "Generate a small web project with files index.html, style.css, script.js, and README.md. Return ONLY valid JSON in this format: {\"files\": {\"index.html\": \"...\", \"style.css\": \"...\", \"script.js\": \"...\", \"README.md\": \"...\"}}"

        response = model.generate_content(prompt)

        # Try parsing AI response as JSON
        import json
        try:
            parsed = json.loads(response.text)
            return jsonify(parsed)
        except Exception:
            # fallback if AI didn’t return valid JSON
            return jsonify({
                "files": {
                    "index.html": "<!DOCTYPE html>\n<html>\n<head><title>Error</title></head>\n<body>\n<h1>AI JSON Parse Failed</h1></body></html>",
                    "style.css": "body { background: red; }",
                    "script.js": "console.error('AI failed to return JSON');",
                    "README.md": "# Error\nAI did not return valid JSON, fallback generated."
                }
            })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ----------------- Auto-complete Code -----------------
@app.route("/autocomplete", methods=["POST"])
def autocomplete():
    data = request.get_json()
    code = data.get("code", "")

    if not code:
        return jsonify({"error": "No code provided"}), 400

    if model is None:
        return jsonify({"completion": code + "\n# (AI not configured, no autocomplete)"})

    try:
        prompt = f"Complete this code without errors:\n\n{code}\n\n### Completed code:"
        response = model.generate_content(prompt)
        return jsonify({"completion": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ----------------- Root -----------------
@app.route("/")
def home():
    return "✅ Backend is running!"


if __name__ == "__main__":
    app.run(debug=True)

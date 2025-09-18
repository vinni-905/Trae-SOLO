from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    message = data.get('message', '')
    reply = f"Mock AI response for: '{message}'"
    return jsonify({'reply': reply})

if __name__ == "__main__":
    app.run(debug=True, port=5000)

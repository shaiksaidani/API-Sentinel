
import json
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, request, jsonify

app = Flask(__name__)

# Project directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Traffic log location
LOG_FILE = PROJECT_ROOT / "logs" / "traffic.jsonl"
LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

# Sample user database (in memory)
users = [
    {"id": 101, "name": "Sahith", "role": "Admin"},
    {"id": 102, "name": "Rahul", "role": "Developer"},
    {"id": 103, "name": "Priya", "role": "Analyst"}
]

# Documented API endpoints
DOCUMENTED_ENDPOINTS = {
    ("GET", "/api/health"),
    ("GET", "/api/users"),
    ("GET", "/api/users/<int:user_id>"),
    ("POST", "/api/users")
}


# Record every API request in JSON Lines format
@app.after_request
def log_request(response):

    route = request.url_rule

    route_template = route.rule if route else None

    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "method": request.method,
        "path": request.path,
        "route_template": route_template,
        "status_code": response.status_code,
        "documented": (
            (request.method, route_template)
            in DOCUMENTED_ENDPOINTS
            if route_template else False
        )
    }

    with LOG_FILE.open("a", encoding="utf-8") as file:
        file.write(json.dumps(event) + "\n")

    return response


# Health-check endpoint
@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "status": "success",
        "message": "API Sentinel Mock API is running"
    }), 200


# Get all users
@app.route("/api/users", methods=["GET"])
def get_users():

    return jsonify({
        "status": "success",
        "count": len(users),
        "users": users
    }), 200


# Get a specific user
@app.route("/api/users/<int:user_id>", methods=["GET"])
def get_user(user_id):

    for user in users:
        if user["id"] == user_id:
            return jsonify({
                "status": "success",
                "user": user
            }), 200

    return jsonify({
        "status": "error",
        "message": "User not found"
    }), 404


# Create a new user
@app.route("/api/users", methods=["POST"])
def create_user():

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "status": "error",
            "message": "A valid JSON object is required"
        }), 400

    name = data.get("name")
    role = data.get("role", "User")

    if not isinstance(name, str) or not name.strip():
        return jsonify({
            "status": "error",
            "message": "Name is required"
        }), 400

    new_id = max((user["id"] for user in users), default=100) + 1

    new_user = {
        "id": new_id,
        "name": name.strip(),
        "role": role
    }

    users.append(new_user)

    return jsonify({
        "status": "success",
        "message": "User created successfully",
        "user": new_user
    }), 201


# Intentionally undocumented endpoint
# Used to demonstrate shadow API discovery
@app.route("/api/internal/reports", methods=["GET"])
def internal_reports():

    return jsonify({
        "status": "success",
        "message": "Internal reports endpoint",
        "reports": [
            {"id": 1, "name": "Monthly Security Report"},
            {"id": 2, "name": "API Traffic Report"}
        ]
    }), 200


# Run the mock API server
if __name__ == "__main__":

    print("Starting API Sentinel Mock API...")
    print("Server: http://127.0.0.1:5001")

    app.run(
        host="127.0.0.1",
        port=5001,
        debug=False
    )

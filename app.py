
from flask import Flask, jsonify, request
from datetime import datetime, timezone
import json
import os

app = Flask(__name__)

# Sample user database for our Mock API
users = [
    {
        "id": 101,
        "name": "Sahith",
        "email": "sahith@example.com"
    },
    {
        "id": 102,
        "name": "Rahul",
        "email": "rahul@example.com"
    },
    {
        "id": 103,
        "name": "Priya",
        "email": "priya@example.com"
    }
]

# Create a logs folder if it does not already exist.
os.makedirs("logs", exist_ok=True)

# These are the endpoints officially documented by our project.
DOCUMENTED_ENDPOINTS = {
    ("GET", "/api/health"),
    ("GET", "/api/products"),
    ("GET", "/api/products/<int:product_id>"),
    ("POST", "/api/orders"),

    # Documented Users API endpoints
    ("GET", "/api/users"),
    ("GET", "/api/users/<int:user_id>"),
    ("POST", "/api/users"),
}



@app.before_request
def record_api_request():
    """Record each incoming request for later analysis."""
    endpoint = request.url_rule.rule if request.url_rule else request.path

    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "method": request.method,
        "path": request.path,
        "route_template": endpoint,
        "status_code": None,
        "documented": (request.method, endpoint) in DOCUMENTED_ENDPOINTS,
    }

    request.api_event = event


@app.after_request
def save_api_request(response):
    """Save request details to a JSON Lines log file."""
    event = getattr(request, "api_event", None)

    if event:
        event["status_code"] = response.status_code

        with open("logs/traffic.jsonl", "a", encoding="utf-8") as log_file:
            log_file.write(json.dumps(event) + "\n")

    return response


@app.get("/api/health")
def health():
    return jsonify({"status": "healthy", "service": "API-Sentinel Mock API"})

# GET API - Retrieve all users
@app.get("/api/users")
def get_users():
    return jsonify({
        "total_users": len(users),
        "users": users
    }), 200

# GET API - Retrieve a specific user
@app.get("/api/users/<int:user_id>")
def get_user(user_id):

    for user in users:
        if user["id"] == user_id:
            return jsonify(user), 200

    return jsonify({
        "error": "User not found",
        "user_id": user_id
    }), 404

# POST API - Create a new user
@app.post("/api/users")
def create_user():

    data = request.get_json(silent=True) or {}

    name = data.get("name")
    email = data.get("email")

    if not name or not email:
        return jsonify({
            "error": "Name and email are required"
        }), 400

    new_id = max(
        (user["id"] for user in users),
        default=100
    ) + 1

    new_user = {
        "id": new_id,
        "name": name,
        "email": email
    }

    users.append(new_user)

    return jsonify({
        "message": "User created successfully",
        "user": new_user
    }), 201


@app.get("/api/products")
def products():
    return jsonify([
        {"id": 1, "name": "Keyboard", "price": 1200},
        {"id": 2, "name": "Mouse", "price": 600},
    ])


@app.get("/api/products/<int:product_id>")
def product_details(product_id):
    product_data = {
        1: {"id": 1, "name": "Keyboard", "price": 1200},
        2: {"id": 2, "name": "Mouse", "price": 600},
    }

    product = product_data.get(product_id)

    if product is None:
        return jsonify({"error": "Product not found"}), 404

    return jsonify(product)


@app.post("/api/orders")
def create_order():
    data = request.get_json(silent=True) or {}

    if "product_id" not in data:
        return jsonify({"error": "product_id is required"}), 400

    return jsonify({
        "message": "Mock order created",
        "product_id": data["product_id"],
    }), 201


# Intentionally undocumented endpoint for our shadow API experiment.
@app.get("/api/internal/report")
def internal_report():
    return jsonify({
        "report": "Mock internal report",
        "environment": "development",
    })
@app.get("/api/internal/reports")
def internal_reports():

    reports = [
        {"id": 1, "name": "Internal Security Report"},
        {"id": 2, "name": "System Activity Report"}
    ]

    return jsonify({
        "message": "Internal reports retrieved successfully",
        "reports": reports
    }), 200


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
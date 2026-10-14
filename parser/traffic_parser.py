
import json
import os
import ipaddress
from datetime import datetime

# Find the project folder and sample data file
PROJECT_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

INPUT_FILE = os.path.join(
    PROJECT_DIR, "parser", "sample_events.json"
)

OUTPUT_FILE = os.path.join(
    PROJECT_DIR, "logs", "parsed_events.json"
)


def parse_event(event):
    """Validate and organize one API traffic event."""

    required_fields = [
        "method",
        "path",
        "source_ip",
        "status_code",
        "timestamp"
    ]

    for field in required_fields:
        if field not in event:
            raise ValueError("Missing field: " + field)

    # Validate HTTP method
    method = event["method"].upper()

    allowed_methods = ["GET", "POST", "PUT", "DELETE", "PATCH"]

    if method not in allowed_methods:
        raise ValueError("Invalid HTTP method")

    # Validate endpoint path
    if not isinstance(event["path"], str):
        raise ValueError("Path must be text")

    if not event["path"].startswith("/"):
        raise ValueError("Path must start with /")

    # Validate status code
    if not isinstance(event["status_code"], int):
        raise ValueError("Status code must be an integer")

    if not 100 <= event["status_code"] <= 599:
        raise ValueError("Invalid HTTP status code")

    # Validate source IP address
    try:
        ipaddress.ip_address(event["source_ip"])
    except ValueError:
        raise ValueError("Invalid source IP address")

    # Validate timestamp
    try:
        datetime.fromisoformat(event["timestamp"])
    except (ValueError, TypeError):
        raise ValueError("Invalid timestamp format")

    # Organize the validated event
    parsed_event = {
        "method": method,
        "endpoint": event["path"],
        "source_ip": event["source_ip"],
        "status_code": event["status_code"],
        "timestamp": event["timestamp"],
        "request_body": event.get("request_body"),
        "authenticated_user_id": event.get("authenticated_user_id"),
        "object_owner_id": event.get("object_owner_id")
    }

    return parsed_event


def main():
    try:
        with open(INPUT_FILE, "r") as file:
            events = json.load(file)

        if not isinstance(events, list):
            raise ValueError("Input must contain a JSON list")

        parsed_events = []
        skipped_count = 0

        for event in events:
            try:
                parsed = parse_event(event)
                parsed_events.append(parsed)
                print("Parsed:", parsed)

            except (ValueError, AttributeError, TypeError) as error:
                skipped_count += 1
                print("Skipping invalid event:", error)

        # Create logs folder if it does not exist
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

        with open(OUTPUT_FILE, "w") as file:
            json.dump(parsed_events, file, indent=4)

        print("\nPARSER SUMMARY")
        print("--------------")
        print("Total input events:", len(events))
        print("Successfully parsed:", len(parsed_events))
        print("Skipped invalid events:", skipped_count)
        print("Output saved to:", OUTPUT_FILE)

    except (OSError, json.JSONDecodeError, ValueError) as error:
        print("Parser error:", error)


if __name__ == "__main__":
    main()



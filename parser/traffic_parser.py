
import json
import os
import ipaddress
from datetime import datetime

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_FILE = os.path.join(PROJECT_DIR, "parser", "sample_events.json")
OUTPUT_FILE = os.path.join(PROJECT_DIR, "logs", "parsed_events.json")


def parse_event(event):
    """Validate and organize one API traffic event."""

    required = ["method", "path", "source_ip", "status_code", "timestamp"]

    for field in required:
        if field not in event:
            raise ValueError("Missing field: " + field)

    method = event["method"].upper()
    if method not in ["GET", "POST", "PUT", "DELETE", "PATCH"]:
        raise ValueError("Invalid HTTP method")

    path = event["path"]
    if not isinstance(path, str) or not path.startswith("/"):
        raise ValueError("Invalid endpoint path")

    status = event["status_code"]
    if not isinstance(status, int) or isinstance(status, bool) or not 100 <= status <= 599:
        raise ValueError("Invalid HTTP status code")

    try:
        ipaddress.ip_address(event["source_ip"])
    except (ValueError, TypeError):
        raise ValueError("Invalid source IP address")

    try:
        datetime.fromisoformat(event["timestamp"])
    except (ValueError, TypeError):
        raise ValueError("Invalid timestamp format")

    return {
        "method": method,
        "endpoint": path,
        "source_ip": event["source_ip"],
        "status_code": status,
        "timestamp": event["timestamp"],
        "request_body": event.get("request_body"),
        "authenticated_user_id": event.get("authenticated_user_id"),
        "object_owner_id": event.get("object_owner_id")
    }


def main():
    try:
        with open(INPUT_FILE, "r") as file:
            events = json.load(file)

        if not isinstance(events, list):
            raise ValueError("Input must contain a JSON list")

        parsed_events = []
        skipped = 0

        for event in events:
            try:
                parsed = parse_event(event)
                parsed_events.append(parsed)
                print("Parsed:", parsed)
            except (ValueError, AttributeError, TypeError) as error:
                skipped += 1
                print("Skipping invalid event:", error)

        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

        with open(OUTPUT_FILE, "w") as file:
            json.dump(parsed_events, file, indent=4)

        print("\nPARSER SUMMARY")
        print("--------------")
        print("Total input events:", len(events))
        print("Successfully parsed:", len(parsed_events))
        print("Skipped invalid events:", skipped)
        print("Output saved to:", OUTPUT_FILE)

    except (OSError, json.JSONDecodeError, ValueError) as error:
        print("Parser error:", error)


if __name__ == "__main__":
    main()




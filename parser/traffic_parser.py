
"""
API-Sentinel — Runtime Traffic Parser.

Supports JSON arrays and JSONL traffic logs, validates HTTP telemetry,
normalizes events, and writes parsed records and summary counts.
"""

import ipaddress
import json
import os
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_INPUT = os.path.join(PROJECT_DIR, "parser", "sample_events.json")
DEFAULT_OUTPUT = os.path.join(PROJECT_DIR, "logs", "parsed_events.json")
JSONL_INPUT = os.path.join(PROJECT_DIR, "logs", "traffic.jsonl")

VALID_HTTP_METHODS = {
    "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"
}


def load_events(file_path: str) -> List[Dict[str, Any]]:
    """Load a JSON array or JSON Lines file."""
    with open(file_path, "r", encoding="utf-8") as file:
        content = file.read().strip()

    if not content:
        return []

    if file_path.lower().endswith(".jsonl"):
        events = []
        for line_number, line in enumerate(content.splitlines(), start=1):
            try:
                event = json.loads(line)
                if isinstance(event, dict):
                    events.append(event)
                else:
                    print(f"Skipping non-object on line {line_number}")
            except json.JSONDecodeError as error:
                print(f"Skipping invalid JSON on line {line_number}: {error}")
        return events

    data = json.loads(content)
    if not isinstance(data, list):
        raise ValueError("Input must contain a JSON list")

    return data


def validate_event(
    raw: Any,
) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
    """Validate and normalize a single event."""
    if not isinstance(raw, dict):
        return False, "Event record must be a JSON object", None

    method_raw = raw.get("method") or raw.get("http_method")
    if not isinstance(method_raw, str) or not method_raw.strip():
        return False, "Missing or invalid method", None

    method = method_raw.strip().upper()
    if method not in VALID_HTTP_METHODS:
        return False, f"Unsupported HTTP method: {method}", None

    path_raw = raw.get("path") or raw.get("endpoint")
    if not isinstance(path_raw, str) or not path_raw.strip():
        return False, "Missing or invalid 'path'", None

    endpoint = path_raw.strip()
    if not endpoint.startswith("/"):
        endpoint = "/" + endpoint

    source_ip = raw.get("source_ip") or raw.get("client_ip") or raw.get("ip")
    if not isinstance(source_ip, str) or not source_ip.strip():
        return False, "Missing or invalid source IP", None

    source_ip = source_ip.strip()
    try:
        ipaddress.ip_address(source_ip)
    except ValueError:
        return False, "Invalid source IP address", None

    status_raw = raw.get("status_code", raw.get("status"))
    if isinstance(status_raw, bool):
        return False, "Invalid status code", None

    try:
        status_code = int(status_raw)
    except (ValueError, TypeError):
        return False, "Invalid status code", None

    if not 100 <= status_code <= 599:
        return False, "Status code out of range", None

    timestamp_raw = raw.get("timestamp") or raw.get("time")
    if not isinstance(timestamp_raw, str) or not timestamp_raw.strip():
        return False, "Missing or invalid timestamp", None

    timestamp = timestamp_raw.strip()
    try:
        datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    except ValueError:
        return False, "Invalid timestamp format", None

    normalized = dict(raw)
    normalized.update({
        "method": method,
        "path": endpoint,
        "endpoint": endpoint,
        "source_ip": source_ip,
        "status_code": status_code,
        "timestamp": timestamp,
    })

    normalized.setdefault("request_body", None)
    normalized.setdefault("authenticated_user_id", None)
    normalized.setdefault("object_owner_id", None)
    normalized.setdefault("route_template", None)
    normalized.setdefault("documented", None)

    return True, None, normalized


def parse_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """Validate one event and return its normalized representation."""
    valid, error, normalized = validate_event(event)
    if not valid or normalized is None:
        raise ValueError(error or "Invalid event")
    return normalized


def parse_traffic_file(
    input_path: str, output_path: str
) -> Dict[str, Any]:
    """Parse JSON or JSONL traffic, write accepted events, and return counts."""
    events = load_events(input_path)
    accepted = []
    skipped_details = []

    for index, event in enumerate(events):
        valid, reason, normalized = validate_event(event)
        if valid and normalized is not None:
            accepted.append(normalized)
        else:
            skipped_details.append({
                "index": index,
                "reason": reason,
                "raw_event": event,
            })

    output_dir = os.path.dirname(os.path.abspath(output_path))
    os.makedirs(output_dir, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as file:
        json.dump(accepted, file, indent=2)

    return {
        "total_input": len(events),
        "accepted_count": len(accepted),
        "skipped_count": len(skipped_details),
        "output_file": output_path,
        "skipped_details": skipped_details,
    }


def main() -> int:
    """Command-line entry point."""
    default_input = (
        JSONL_INPUT if os.path.exists(JSONL_INPUT) else DEFAULT_INPUT
    )
    input_file = sys.argv[1] if len(sys.argv) > 1 else default_input
    output_file = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_OUTPUT

    try:
        result = parse_traffic_file(input_file, output_file)
        print("API-Sentinel Traffic Parser")
        print(f"Total input: {result['total_input']}")
        print(f"Accepted: {result['accepted_count']}")
        print(f"Skipped: {result['skipped_count']}")
        print(f"Output: {result['output_file']}")
        return 0
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"Parser error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

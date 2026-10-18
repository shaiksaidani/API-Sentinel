"""
API-Sentinel — Runtime Traffic Parser (Week 3 Deliverable)

Parses raw simulated network traffic events from parser/sample_events.json,
validates required schema attributes, normalizes HTTP verbs and endpoints,
and writes structured records to logs/parsed_events.json.
"""

import os
import sys
import json
import ipaddress
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple

VALID_HTTP_METHODS = {"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"}


def validate_event(raw: Any) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
    """
    Validates a single raw event record against expected schema.
    Returns (is_valid, error_reason, normalized_event).
    """
    if not isinstance(raw, dict):
        return False, "Event record must be a JSON object", None

    # Required: method
    method_raw = raw.get("method") or raw.get("http_method")
    if not isinstance(method_raw, str) or not method_raw.strip():
        return False, "Missing or invalid 'method'", None
    method = method_raw.strip().upper()
    if method not in VALID_HTTP_METHODS:
        return False, f"Unsupported HTTP method: '{method}'", None

    # Required: path or endpoint
    path_raw = raw.get("path") or raw.get("endpoint")
    if not isinstance(path_raw, str) or not path_raw.strip():
        return False, "Missing or invalid 'path'/'endpoint'", None
    endpoint = path_raw.strip()
    if not endpoint.startswith("/"):
        endpoint = "/" + endpoint

    # Required: source_ip
    source_ip = raw.get("source_ip") or raw.get("client_ip") or raw.get("ip")
    if not isinstance(source_ip, str) or not source_ip.strip():
        return False, "Missing or invalid 'source_ip'", None

    try:
        ipaddress.ip_address(source_ip.strip())
    except (ValueError, TypeError):
        return False, "Invalid source IP address", None

    # Required: status_code
    status_raw = raw.get("status_code") or raw.get("status")
    if isinstance(status_raw, bool):
        return False, f"Invalid numeric 'status_code': {status_raw}", None
    try:
        status_code = int(status_raw)
        if not (100 <= status_code <= 599):
            return False, f"Status code {status_code} out of valid range (100-599)", None
    except (ValueError, TypeError):
        return False, f"Invalid numeric 'status_code': {status_raw}", None

    # Required: timestamp
    timestamp_raw = raw.get("timestamp") or raw.get("time")
    if not timestamp_raw:
        return False, "Missing required 'timestamp'", None
    # Validate ISO timestamp or parsable date
    try:
        clean_ts = str(timestamp_raw).replace("Z", "+00:00")
        datetime.fromisoformat(clean_ts)
        timestamp = str(timestamp_raw)
    except (ValueError, TypeError):
        return False, f"Invalid timestamp format: {timestamp_raw}", None

    # Optional fields preserved safely
    request_body = raw.get("request_body")
    authenticated_user_id = raw.get("authenticated_user_id")
    object_owner_id = raw.get("object_owner_id")

    normalized = {
        "method": method,
        "endpoint": endpoint,
        "source_ip": source_ip.strip(),
        "status_code": status_code,
        "timestamp": timestamp,
        "request_body": request_body,
        "authenticated_user_id": authenticated_user_id,
        "object_owner_id": object_owner_id
    }

    return True, None, normalized


def parse_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and organize one API traffic event (for backwards compatibility with tests)."""
    if not isinstance(event, dict):
        raise ValueError("Event must be a dictionary")

    required = ["method", "path", "source_ip", "status_code", "timestamp"]
    for field in required:
        if field not in event:
            raise ValueError("Missing field: " + field)

    is_valid, err, norm = validate_event(event)
    if not is_valid:
        raise ValueError(err)

    return norm


def parse_traffic_file(input_path: str, output_path: str) -> Dict[str, Any]:
    """
    Reads events from input_path, validates each record, skips invalid entries,
    and writes normalized events to output_path.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input event file not found: {input_path}")

    with open(input_path, "r", encoding="utf-8") as f:
        try:
            raw_data = json.load(f)
        except json.JSONDecodeError as err:
            raise ValueError(f"Malformed JSON in input file: {err}")

    if not isinstance(raw_data, list):
        raise ValueError("Root JSON in input file must be an array of event objects")

    accepted_events: List[Dict[str, Any]] = []
    skipped_events: List[Dict[str, Any]] = []

    for idx, item in enumerate(raw_data):
        is_valid, reason, normalized = validate_event(item)
        if is_valid and normalized is not None:
            accepted_events.append(normalized)
        else:
            skipped_events.append({
                "index": idx,
                "reason": reason,
                "raw_event": item
            })

    # Ensure output directory exists
    out_dir = os.path.dirname(os.path.abspath(output_path))
    if out_dir and not os.path.exists(out_dir):
        os.makedirs(out_dir, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(accepted_events, f, indent=2)

    return {
        "total_input": len(raw_data),
        "accepted_count": len(accepted_events),
        "skipped_count": len(skipped_events),
        "output_file": output_path,
        "skipped_details": skipped_events
    }


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    default_input = os.path.join(base_dir, "parser", "sample_events.json")
    default_output = os.path.join(base_dir, "logs", "parsed_events.json")

    input_file = sys.argv[1] if len(sys.argv) > 1 else default_input
    output_file = sys.argv[2] if len(sys.argv) > 2 else default_output

    print(f"[*] API-Sentinel Traffic Parser running...")
    print(f"[*] Reading from: {input_file}")

    try:
        result = parse_traffic_file(input_file, output_file)
        print(f"[+] Parsing complete!")
        print(f"    Total Input:    {result['total_input']}")
        print(f"    Accepted:       {result['accepted_count']}")
        print(f"    Skipped:        {result['skipped_count']}")
        print(f"    Output Written: {result['output_file']}")
    except Exception as e:
        print(f"[-] Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

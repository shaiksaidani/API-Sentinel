"""
API-Sentinel — Event Summary Calculator (Week 3 Deliverable)

Analyzes normalized events from logs/parsed_events.json,
computes HTTP method distribution, response status categorization,
error rates, and endpoint access frequencies.
"""

import os
import sys
import json
from typing import Dict, List, Any


def compute_summary_metrics(events: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes mathematical summary metrics across a list of normalized events.
    Mutually exclusive status categories ensure each event is counted exactly once.
    """
    total_requests = len(events)
    methods: Dict[str, int] = {}
    endpoints: Dict[str, int] = {}
    status_categories = {
        "2xx": 0,
        "3xx": 0,
        "4xx": 0,
        "5xx": 0,
        "other": 0
    }
    status_code_counts: Dict[str, int] = {}
    error_count = 0
    potential_auth_review_count = 0
    uncataloged_endpoint_count = 0

    for ev in events:
        # Method count
        m = ev.get("method", "UNKNOWN").upper()
        methods[m] = methods.get(m, 0) + 1

        # Endpoint count
        ep = ev.get("endpoint", "/unknown")
        endpoints[ep] = endpoints.get(ep, 0) + 1

        # Status code category
        sc = ev.get("status_code", 0)
        sc_str = str(sc)
        status_code_counts[sc_str] = status_code_counts.get(sc_str, 0) + 1

        if 200 <= sc < 300:
            status_categories["2xx"] += 1
        elif 300 <= sc < 400:
            status_categories["3xx"] += 1
        elif 400 <= sc < 500:
            status_categories["4xx"] += 1
            error_count += 1
        elif 500 <= sc < 600:
            status_categories["5xx"] += 1
            error_count += 1
        else:
            status_categories["other"] += 1

        # User/Owner discrepancy check (potential authorization review candidate)
        auth_user = ev.get("authenticated_user_id")
        owner_user = ev.get("object_owner_id")
        if auth_user and owner_user and auth_user != owner_user:
            potential_auth_review_count += 1

        # Uncataloged candidates (heuristic)
        if "unknown" in ep.lower():
            uncataloged_endpoint_count += 1

    success_count = status_categories["2xx"]
    success_rate = round((success_count / total_requests * 100.0), 2) if total_requests > 0 else 0.0

    return {
        "total_requests": total_requests,
        "methods": methods,
        "endpoints": endpoints,
        "status_categories": status_categories,
        "status_code_counts": status_code_counts,
        "error_count": error_count,
        "success_rate": success_rate,
        "potential_auth_review_count": potential_auth_review_count,
        "uncataloged_endpoint_count": uncataloged_endpoint_count
    }


def generate_summary(log_file: str) -> Dict[str, Any]:
    if not os.path.exists(log_file):
        raise FileNotFoundError(f"Parsed log file not found: {log_file}")

    with open(log_file, "r", encoding="utf-8") as f:
        events = json.load(f)

    if not isinstance(events, list):
        raise ValueError("Parsed log file must contain a JSON array of events")

    return compute_summary_metrics(events)


def compute_summary_metrics(events):
    """Calculate API traffic summary metrics for tests and the backend."""
    methods = {}
    endpoints = {}
    status_categories = {"2xx": 0, "4xx": 0, "5xx": 0}
    error_count = 0
    potential_auth_review_count = 0

    for event in events:
        method = event.get("method", "UNKNOWN")
        endpoint = event.get("endpoint", event.get("path", "UNKNOWN"))

        methods[method] = methods.get(method, 0) + 1
        endpoints[endpoint] = endpoints.get(endpoint, 0) + 1

        try:
            status = int(event.get("status_code", 0))
        except (ValueError, TypeError):
            status = 0

        if 200 <= status < 300:
            status_categories["2xx"] += 1
        elif 400 <= status < 500:
            status_categories["4xx"] += 1
            error_count += 1
        elif 500 <= status < 600:
            status_categories["5xx"] += 1
            error_count += 1

        if status == 0:
            continue
        if 300 <= status < 400:
            continue
        if 100 <= status < 200:
            continue
        if 400 <= status < 600 and status < 500:
            # Count client errors too; error_count is counted above.
            pass

        user_id = event.get("authenticated_user_id")
        owner_id = event.get("object_owner_id")
        if user_id is not None and owner_id is not None and user_id != owner_id:
            potential_auth_review_count += 1

    total = len(events)
    success_rate = status_categories["2xx"] * 100.0 / total if total else 0.0

    return {
        "total_requests": total,
        "methods": methods,
        "endpoints": endpoints,
        "status_categories": status_categories,
        "error_count": error_count,
        "success_rate": success_rate,
        "potential_auth_review_count": potential_auth_review_count,
    }


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    default_log = os.path.join(base_dir, "logs", "parsed_events.json")
    log_file = sys.argv[1] if len(sys.argv) > 1 else default_log

    print(f"[*] API-Sentinel Event Summary Generator")
    print(f"[*] Reading log file: {log_file}")

    try:
        summary = generate_summary(log_file)
        print("\n=== TRAFFIC SUMMARY METRICS ===")
        print(f"Total Requests:       {summary['total_requests']}")
        print(f"Success Rate:         {summary['success_rate']:.2f}%")
        print(f"HTTP Errors (>=400):  {summary['error_count']}")
        print("\n--- Methods Breakdown ---")
        for m, count in sorted(summary['methods'].items()):
            print(f"  {m:<8}: {count}")
        print("\n--- Status Categories ---")
        for cat, count in sorted(summary['status_categories'].items()):
            print(f"  {cat:<8}: {count}")
        print("\n--- Endpoint Frequencies ---")
        for ep, count in sorted(summary['endpoints'].items(), key=lambda x: -x[1]):
            print(f"  {ep:<20}: {count}")
        print("===============================\n")
    except Exception as e:
        print(f"[-] Summary Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

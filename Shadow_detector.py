
import os
import json
from collections import defaultdict
from pathlib import Path
from datetime import datetime, timezone

LOG_FILE = Path("logs/traffic.jsonl")
DOCUMENTATION_FILE = Path("documented_endpoints.json")


def load_documented_endpoints():
    with DOCUMENTATION_FILE.open("r", encoding="utf-8") as file:
        data = json.load(file)

    return {
        (item["method"].upper(), item["path"])
        for item in data["endpoints"]
    }


def detect_shadow_candidates():
    documented = load_documented_endpoints()
    observed = defaultdict(lambda: {"count": 0, "status_codes": set()})

    if not LOG_FILE.exists():
        print(f"Log file not found: {LOG_FILE}")
        return

    with LOG_FILE.open("r", encoding="utf-8") as file:
        for line_number, line in enumerate(file, start=1):
            if not line.strip():
                continue

            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                print(f"Skipping invalid JSON on line {line_number}")
                continue

            method = event.get("method", "").upper()
            path = event.get("route_template") or event.get("path", "")
            status = event.get("status_code")

            if not method or not path:
                continue

            key = (method, path)
            observed[key]["count"] += 1
            observed[key]["status_codes"].add(status)

    
    candidates = []
    unknown_paths = []

    for (method, path), details in observed.items():
        if (method, path) in documented:
            continue

        statuses = details["status_codes"]

        if statuses and all(code == 404 for code in statuses):
            unknown_paths.append((method, path, details))
        else:
            candidates.append((method, path, details))

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "documented_endpoints": len(documented),
        "observed_endpoints": len(observed),
        "shadow_api_candidates": [
            {
                "method": method,
                "path": path,
                "request_count": details["count"],
                "status_codes": sorted(
                    code for code in details["status_codes"]
                    if code is not None
                ),
            }
            for method, path, details in candidates
        ],
        "unknown_paths": [
            {
                "method": method,
                "path": path,
                "request_count": details["count"],
                "status_codes": sorted(
                    code for code in details["status_codes"]
                    if code is not None
                ),
            }
            for method, path, details in unknown_paths
        ],
    }

    os.makedirs("reports", exist_ok=True)

    with open("reports/shadow_report.json", "w", encoding="utf-8") as file:
        json.dump(report, file, indent=2)

    print("\nJSON report saved to reports/shadow_report.json")


    print("\n=== API-Sentinel Shadow API Scan ===")
    print(f"Documented endpoints: {len(documented)}")
    print(f"Observed endpoints:   {len(observed)}")
    print(f"Shadow API candidates: {len(candidates)}")
    print(f"Unknown paths (404 only): {len(unknown_paths)}")

    for method, path, details in sorted(candidates):
        codes = sorted(
            str(code) for code in details["status_codes"]
            if code is not None
        )

        print(f"\n[SHADOW API CANDIDATE] {method} {path}")
        print(f"  Observed requests: {details['count']}")
        print(f"  HTTP status codes: {', '.join(codes) or 'Unknown'}")

    for method, path, details in sorted(unknown_paths):
        print(f"\n[UNKNOWN PATH] {method} {path}")
        print("  Reason: All observed responses were HTTP 404.")

if __name__ == "__main__":
    detect_shadow_candidates()

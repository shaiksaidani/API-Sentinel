#!/usr/bin/env python3
"""Adapt authorized local API access logs (JSON Lines) to API-Sentinel's schema.

Expected input: one JSON object per line with method, endpoint/path, source_ip,
status_code, timestamp, and optional request_body. This is a narrow log adapter;
it does not parse packets or replace the team's shared traffic parser.
"""
from __future__ import annotations
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, TextIO


def normalize_access_record(record: dict[str, Any]) -> dict[str, Any]:
    method = record.get("method")
    endpoint = record.get("endpoint", record.get("path"))
    source_ip = record.get("source_ip", record.get("client_ip"))
    status_code = record.get("status_code")
    timestamp = record.get("timestamp")

    if not isinstance(method, str) or not method.strip():
        raise ValueError("method must be a non-empty string")
    if not isinstance(endpoint, str) or not endpoint.startswith("/"):
        raise ValueError("endpoint/path must be an absolute URL path beginning with '/'")
    if not isinstance(source_ip, str) or not source_ip.strip():
        raise ValueError("source_ip/client_ip must be a non-empty string")
    if status_code is not None and (not isinstance(status_code, int) or not 100 <= status_code <= 599):
        raise ValueError("status_code must be an HTTP status integer from 100 to 599 or null")
    if not isinstance(timestamp, str) or not timestamp.strip():
        timestamp = datetime.now(timezone.utc).isoformat()

    # Do not log bodies by default. Preserve only when the source log explicitly has it.
    body = record.get("request_body") if "request_body" in record else None
    return {
        "method": method.upper(),
        "endpoint": endpoint,
        "source_ip": source_ip,
        "status_code": status_code,
        "timestamp": timestamp,
        "request_body": body,
        "event_type": "http_access_log",
        "data_source": "authorized application access log",
    }


def convert(input_stream: TextIO, output_stream: TextIO) -> int:
    converted = 0
    for line_no, line in enumerate(input_stream, start=1):
        if not line.strip():
            continue
        try:
            record = json.loads(line)
            if not isinstance(record, dict):
                raise ValueError("each input line must be a JSON object")
            event = normalize_access_record(record)
        except (json.JSONDecodeError, ValueError) as exc:
            print(f"line {line_no}: skipped invalid access log record: {exc}", file=sys.stderr)
            continue
        output_stream.write(json.dumps(event, separators=(",", ":")) + "\n")
        converted += 1
    output_stream.flush()
    return converted


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", help="input JSONL access log file")
    parser.add_argument("--output", default="logs/http_events.jsonl", help="output JSONL path")
    args = parser.parse_args()
    source = Path(args.input)
    destination = Path(args.output)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with source.open(encoding="utf-8") as inp, destination.open("a", encoding="utf-8") as out:
        count = convert(inp, out)
    print(f"Converted {count} access-log record(s) into {destination}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())

"""Summarize TCP state-change events stored as JSON Lines."""

import json
from collections import Counter
from pathlib import Path


DEFAULT_INPUT = Path("logs/network_events.jsonl")


def summarize_tcp_events(input_path=DEFAULT_INPUT):
    """Read TCP events and return summary metrics."""
    event_types = Counter()
    source_ips = Counter()
    destination_ips = Counter()
    state_changes = Counter()
    total_events = 0
    skipped_lines = 0

    with open(input_path, "r", encoding="utf-8") as file:
        for line in file:
            if not line.strip():
                continue

            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                skipped_lines += 1
                continue

            if not isinstance(event, dict):
                skipped_lines += 1
                continue

            if event.get("event_type") != "tcp_state_change":
                continue

            if event.get("protocol") != "TCP":
                skipped_lines += 1
                continue

            required = (
                "source_ip",
                "source_port",
                "destination_ip",
                "destination_port",
                "old_state",
                "new_state",
            )
            if any(field not in event for field in required):
                skipped_lines += 1
                continue

            total_events += 1
            event_types[event["event_type"]] += 1
            source_ips[event["source_ip"]] += 1
            destination_ips[event["destination_ip"]] += 1
            state_changes[
                f'{event["old_state"]}->{event["new_state"]}'
            ] += 1

    return {
        "total_tcp_events": total_events,
        "skipped_lines": skipped_lines,
        "source_ips": dict(source_ips),
        "destination_ips": dict(destination_ips),
        "state_changes": dict(state_changes),
    }


def main():
    summary = summarize_tcp_events()
    print(json.dumps(summary, indent=4))


if __name__ == "__main__":
    main()

import json
from pathlib import Path

from parser.traffic_parser import parse_traffic_file


HTTP_EVENT = {
    "method": "GET",
    "path": "/api/health",
    "source_ip": "127.0.0.1",
    "status_code": 200,
    "timestamp": "2026-11-10T10:00:00Z"
}

TCP_EVENT = {
    "event_type": "tcp_state_change",
    "protocol": "TCP",
    "source_ip": "127.0.0.1",
    "source_port": 5000,
    "destination_ip": "127.0.0.1",
    "destination_port": 50824,
    "old_state": 7,
    "new_state": 2
}


def test_mixed_http_tcp_json_file(tmp_path):
    input_file = tmp_path / "mixed.json"
    output_file = tmp_path / "parsed.json"

    invalid_event = {"method": "INVALID", "path": "wrong-path"}

    input_file.write_text(
        json.dumps([HTTP_EVENT, TCP_EVENT, invalid_event]),
        encoding="utf-8"
    )

    result = parse_traffic_file(str(input_file), str(output_file))
    parsed = json.loads(output_file.read_text(encoding="utf-8"))

    assert result == {
        "total_input": 3,
        "accepted_count": 2,
        "skipped_count": 1
    }
    assert len(parsed) == 2
    assert any(event.get("event_type") == "tcp_state_change" for event in parsed)
    assert any(event.get("method") == "GET" for event in parsed)


def test_mixed_http_tcp_jsonl_file(tmp_path):
    input_file = tmp_path / "mixed.jsonl"
    output_file = tmp_path / "parsed.json"

    input_file.write_text(
        json.dumps(HTTP_EVENT) + "\n" + json.dumps(TCP_EVENT) + "\n",
        encoding="utf-8"
    )

    result = parse_traffic_file(str(input_file), str(output_file))
    parsed = json.loads(output_file.read_text(encoding="utf-8"))

    assert result["total_input"] == 2
    assert result["accepted_count"] == 2
    assert result["skipped_count"] == 0
    assert len(parsed) == 2

import json
import tempfile
import unittest
from pathlib import Path

from monitoring.tcp_event_summary import summarize_tcp_events


class TCPEventSummaryTests(unittest.TestCase):
    def test_summary_counts_tcp_events(self):
        events = [
            {
                "event_type": "tcp_state_change",
                "protocol": "TCP",
                "source_ip": "127.0.0.1",
                "source_port": 5000,
                "destination_ip": "127.0.0.1",
                "destination_port": 8000,
                "old_state": 2,
                "new_state": 7,
            },
            {
                "event_type": "tcp_state_change",
                "protocol": "TCP",
                "source_ip": "192.168.1.10",
                "source_port": 5001,
                "destination_ip": "192.168.1.20",
                "destination_port": 443,
                "old_state": 2,
                "new_state": 1,
            },
        ]

        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "events.jsonl"
            path.write_text(
                "\n".join(json.dumps(event) for event in events) + "\n",
                encoding="utf-8",
            )

            summary = summarize_tcp_events(path)

        self.assertEqual(summary["total_tcp_events"], 2)
        self.assertEqual(summary["skipped_lines"], 0)
        self.assertEqual(summary["source_ips"]["127.0.0.1"], 1)
        self.assertEqual(summary["destination_ips"]["192.168.1.20"], 1)
        self.assertEqual(summary["state_changes"]["2->7"], 1)
        self.assertEqual(summary["state_changes"]["2->1"], 1)

    def test_invalid_json_line_is_skipped(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "events.jsonl"
            path.write_text(
                '{"event_type":"tcp_state_change","protocol":"TCP",'
                '"source_ip":"127.0.0.1","source_port":1,'
                '"destination_ip":"127.0.0.1","destination_port":2,'
                '"old_state":2,"new_state":7}\n'
                'not-json\n',
                encoding="utf-8",
            )

            summary = summarize_tcp_events(path)

        self.assertEqual(summary["total_tcp_events"], 1)
        self.assertEqual(summary["skipped_lines"], 1)


if __name__ == "__main__":
    unittest.main()

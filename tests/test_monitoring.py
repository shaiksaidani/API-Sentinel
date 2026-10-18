import io
import json
import unittest
from monitoring.ebpf_tcp_accept import network_event, ipv4_from_u32
from monitoring.access_log_adapter import normalize_access_record, convert

class MonitoringTests(unittest.TestCase):
    def test_network_event_keeps_unobserved_http_fields_null(self):
        event = network_event("127.0.0.1", "127.0.0.1", 54321, 8000, 123, "python", "2026-10-10T00:00:00Z")
        self.assertEqual(event["source_ip"], "127.0.0.1")
        self.assertEqual(event["event_type"], "tcp_connection_accepted")
        for field in ("method", "endpoint", "status_code", "request_body"):
            self.assertIsNone(event[field])
        self.assertEqual(event["local_port"], 8000)

    def test_ipv4_decode(self):
        import socket, struct
        packed = socket.inet_aton("127.0.0.1")
        value = struct.unpack("I", packed)[0]
        self.assertEqual(ipv4_from_u32(value), "127.0.0.1")

    def test_access_log_normalization(self):
        event = normalize_access_record({
            "method": "get", "path": "/api/users/101", "client_ip": "127.0.0.1",
            "status_code": 200, "timestamp": "2026-10-10T00:00:00Z"
        })
        self.assertEqual(event["method"], "GET")
        self.assertEqual(event["endpoint"], "/api/users/101")
        self.assertIsNone(event["request_body"])

    def test_bad_endpoint_rejected(self):
        with self.assertRaises(ValueError):
            normalize_access_record({"method": "GET", "endpoint": "api/users", "source_ip": "127.0.0.1", "status_code": 200, "timestamp": "now"})

    def test_jsonl_converter_skips_bad_lines(self):
        src = io.StringIO('{"method":"GET","endpoint":"/health","source_ip":"127.0.0.1","status_code":200,"timestamp":"2026-10-10T00:00:00Z"}\nnot-json\n')
        dst = io.StringIO()
        count = convert(src, dst)
        self.assertEqual(count, 1)
        event = json.loads(dst.getvalue())
        self.assertEqual(event["endpoint"], "/health")

if __name__ == "__main__":
    unittest.main()

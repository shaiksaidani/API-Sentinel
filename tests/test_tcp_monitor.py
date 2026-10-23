import json
import unittest


class TCPMonitorTests(unittest.TestCase):
    def test_tcp_state_change_event_json(self):
        raw_event = (
            '{"event_type":"tcp_state_change",'
            '"protocol":"TCP",'
            '"source_ip":"127.0.0.1",'
            '"source_port":50824,'
            '"destination_ip":"127.0.0.1",'
            '"destination_port":5000,'
            '"old_state":2,'
            '"new_state":7}'
        )

        event = json.loads(raw_event)

        self.assertEqual(event["event_type"], "tcp_state_change")
        self.assertEqual(event["protocol"], "TCP")
        self.assertEqual(event["source_ip"], "127.0.0.1")
        self.assertEqual(event["source_port"], 50824)
        self.assertEqual(event["destination_ip"], "127.0.0.1")
        self.assertEqual(event["destination_port"], 5000)
        self.assertIsInstance(event["old_state"], int)
        self.assertIsInstance(event["new_state"], int)

    def test_invalid_json_event_rejected(self):
        with self.assertRaises(json.JSONDecodeError):
            json.loads('{"event_type":"tcp_state_change"')


if __name__ == "__main__":
    unittest.main()

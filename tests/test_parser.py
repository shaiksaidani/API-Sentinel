
import unittest
import sys
import os

PROJECT_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)
sys.path.insert(0, PROJECT_DIR)

from parser.traffic_parser import parse_event


class TestTrafficParser(unittest.TestCase):

    def setUp(self):
        self.valid_event = {
            "method": "GET",
            "path": "/api/users/101",
            "source_ip": "127.0.0.1",
            "status_code": 200,
            "timestamp": "2026-10-09T10:00:00"
        }

    def test_valid_event(self):
        parsed = parse_event(self.valid_event)
        self.assertEqual(parsed["method"], "GET")
        self.assertEqual(
            parsed["endpoint"],
            "/api/users/101"
        )

    def test_method_uppercase(self):
        event = self.valid_event.copy()
        event["method"] = "get"

        parsed = parse_event(event)

        self.assertEqual(parsed["method"], "GET")

    def test_missing_field(self):
        event = self.valid_event.copy()
        del event["path"]

        with self.assertRaises((ValueError, KeyError)):
            parse_event(event)

    def test_invalid_method(self):
        event = self.valid_event.copy()
        event["method"] = "INVALID"

        with self.assertRaises(ValueError):
            parse_event(event)

    def test_invalid_status_code(self):
        event = self.valid_event.copy()
        event["status_code"] = 700

        with self.assertRaises(ValueError):
            parse_event(event)

    def test_invalid_ip_address(self):
        event = self.valid_event.copy()
        event["source_ip"] = "invalid-ip"

        with self.assertRaises(ValueError):
            parse_event(event)

    def test_invalid_timestamp(self):
        event = self.valid_event.copy()
        event["timestamp"] = "not-a-date"

        with self.assertRaises(ValueError):
            parse_event(event)

    def test_request_body_is_preserved(self):
        event = self.valid_event.copy()
        event["request_body"] = {
            "username": "test_user"
        }

        parsed = parse_event(event)

        self.assertEqual(
            parsed["request_body"],
            {"username": "test_user"}
        )

    def test_identity_fields_are_preserved(self):
        event = self.valid_event.copy()
        event["authenticated_user_id"] = "user_101"
        event["object_owner_id"] = "user_202"

        parsed = parse_event(event)

        self.assertEqual(
            parsed["authenticated_user_id"],
            "user_101"
        )
        self.assertEqual(
            parsed["object_owner_id"],
            "user_202"
        )


if __name__ == "__main__":
    unittest.main()

    


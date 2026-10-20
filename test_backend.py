"""
API-Sentinel — Backend & Parser Automated Test Suite (Week 3)

Validates FastAPI endpoints, traffic parser normalization, summary metrics,
and error handling edge cases.
"""

import os
import sys
import json
import unittest
import tempfile
import asyncio

# Ensure project root is in python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from parser.traffic_parser import validate_event, parse_traffic_file
from parser.event_summary import compute_summary_metrics
from backend.main import app, load_parsed_events_safely
from starlette.testclient import TestClient


class TestTrafficParser(unittest.TestCase):
    """Tests for parser/traffic_parser.py"""

    def test_valid_event_normalization(self):
        raw = {
            "method": "get",
            "path": "/api/users",
            "source_ip": "127.0.0.1",
            "status_code": "200",
            "timestamp": "2026-10-09T10:00:00",
            "request_body": None
        }
        is_valid, err, norm = validate_event(raw)
        self.assertTrue(is_valid)
        self.assertIsNone(err)
        self.assertEqual(norm["method"], "GET")
        self.assertEqual(norm["endpoint"], "/api/users")
        self.assertEqual(norm["status_code"], 200)

    def test_invalid_method_rejected(self):
        raw = {
            "method": "INVALID_VERB",
            "path": "/api/test",
            "source_ip": "127.0.0.1",
            "status_code": 200,
            "timestamp": "2026-10-09T10:00:00"
        }
        is_valid, err, norm = validate_event(raw)
        self.assertFalse(is_valid)
        self.assertIn("Unsupported HTTP method", err)

    def test_invalid_status_code_rejected(self):
        raw = {
            "method": "GET",
            "path": "/api/test",
            "source_ip": "127.0.0.1",
            "status_code": 999,
            "timestamp": "2026-10-09T10:00:00"
        }
        is_valid, err, norm = validate_event(raw)
        self.assertFalse(is_valid)
        self.assertIn("range", err)

    def test_missing_path_rejected(self):
        raw = {
            "method": "GET",
            "source_ip": "127.0.0.1",
            "status_code": 200,
            "timestamp": "2026-10-09T10:00:00"
        }
        is_valid, err, norm = validate_event(raw)
        self.assertFalse(is_valid)
        self.assertIn("Missing or invalid 'path'", err)

    def test_parse_sample_file_produces_expected_counts(self):
        sample_path = os.path.join(BASE_DIR, "parser", "sample_events.json")
        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            res = parse_traffic_file(sample_path, tmp_path)
            self.assertEqual(res["total_input"], 4)
            self.assertEqual(res["accepted_count"], 4)
            self.assertEqual(res["skipped_count"], 0)

            with open(tmp_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.assertEqual(len(data), 4)
                self.assertEqual(data[0]["endpoint"], "/api/users")
                self.assertEqual(data[3]["authenticated_user_id"], "user_2")
                self.assertEqual(data[3]["object_owner_id"], "user_1")
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    def test_malformed_input_file_handling(self):
        with tempfile.NamedTemporaryFile(suffix=".json", mode="w", delete=False) as tmp:
            tmp.write("{ invalid json")
            tmp_path = tmp.name

        try:
            with self.assertRaises(ValueError):
                parse_traffic_file(tmp_path, "dummy.json")
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)


class TestEventSummary(unittest.TestCase):
    """Tests for parser/event_summary.py"""

    def test_summary_metrics_match_sample_expectations(self):
        sample_events = [
            {"method": "GET", "endpoint": "/api/users", "status_code": 200, "source_ip": "127.0.0.1"},
            {"method": "GET", "endpoint": "/api/users/101", "status_code": 200, "source_ip": "127.0.0.1"},
            {"method": "GET", "endpoint": "/api/unknown", "status_code": 404, "source_ip": "127.0.0.1"},
            {"method": "POST", "endpoint": "/api/users", "status_code": 201, "source_ip": "127.0.0.1", "authenticated_user_id": "user_2", "object_owner_id": "user_1"}
        ]
        metrics = compute_summary_metrics(sample_events)

        self.assertEqual(metrics["total_requests"], 4)
        self.assertEqual(metrics["methods"]["GET"], 3)
        self.assertEqual(metrics["methods"]["POST"], 1)
        self.assertEqual(metrics["status_categories"]["2xx"], 3)
        self.assertEqual(metrics["status_categories"]["4xx"], 1)
        self.assertEqual(metrics["status_categories"]["5xx"], 0)
        self.assertEqual(metrics["error_count"], 1)
        self.assertEqual(metrics["success_rate"], 75.0)
        self.assertEqual(metrics["endpoints"]["/api/users"], 2)
        self.assertEqual(metrics["endpoints"]["/api/users/101"], 1)
        self.assertEqual(metrics["endpoints"]["/api/unknown"], 1)
        self.assertEqual(metrics["potential_auth_review_count"], 1)

    def test_empty_events_metrics(self):
        metrics = compute_summary_metrics([])
        self.assertEqual(metrics["total_requests"], 0)
        self.assertEqual(metrics["success_rate"], 0.0)
        self.assertEqual(metrics["error_count"], 0)


class TestFastApiBackend(unittest.TestCase):
    """Tests for FastAPI endpoints via TestClient"""

    def setUp(self):
        self.client = TestClient(app)

    def test_health_endpoint(self):
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["version"], "1.0.0")
        self.assertTrue(data["parser_available"])

    def test_events_endpoint(self):
        response = self.client.get("/api/v1/events")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIsInstance(data["events"], list)
        self.assertGreaterEqual(len(data["events"]), 4)

    def test_metrics_summary_endpoint(self):
        response = self.client.get("/api/v1/metrics/summary")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total_requests"], 4)
        self.assertEqual(data["methods"]["GET"], 3)
        self.assertEqual(data["methods"]["POST"], 1)
        self.assertEqual(data["status_categories"]["2xx"], 3)
        self.assertEqual(data["status_categories"]["4xx"], 1)
        self.assertEqual(data["error_count"], 1)
        self.assertEqual(data["success_rate"], 75.0)

    def test_endpoints_inventory_endpoint(self):
        response = self.client.get("/api/v1/endpoints")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(data["count"], 3)

    def test_shadow_candidates_endpoint(self):
        response = self.client.get("/api/v1/detections/shadow-apis")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(data["count"], 1)

    def test_bola_candidates_endpoint(self):
        response = self.client.get("/api/v1/detections/bola")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["count"], 1)
        candidate = data["candidates"][0]
        self.assertEqual(candidate["authenticated_user_id"], "user_2")
        self.assertEqual(candidate["object_owner_id"], "user_1")
        self.assertEqual(candidate["detection_type"], "Potential Authorization Review Candidate")

    def test_parser_run_endpoint(self):
        response = self.client.post("/api/v1/parser/run")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["total_events_loaded"], 4)


if __name__ == "__main__":
    unittest.main()

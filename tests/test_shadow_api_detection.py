from fastapi.testclient import TestClient

import main


client = TestClient(main.app)


def test_undocumented_route_with_status_200_is_shadow_api(monkeypatch):
    events = [
        {
            "endpoint": "/api/internal/reports",
            "status_code": 200,
            "documented": False
        }
    ]

    monkeypatch.setattr(
        main,
        "load_parsed_events_safely",
        lambda: events
    )

    response = client.get("/api/v1/detections/shadow-apis")

    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert data["count"] == 1
    assert data["candidates"] == events

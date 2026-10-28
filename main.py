"""
API-Sentinel — FastAPI Backend Gateway (Week 3 Deliverable)

Exposes REST endpoints consumed by the React SOC Dashboard,
coordinates parser execution via safe subprocess dispatch,
and aggregates runtime telemetry from logs/parsed_events.json.
"""

import os
import sys
import json
import asyncio
import subprocess
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Project directory paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARSER_SCRIPT = os.path.join(BASE_DIR, "parser", "traffic_parser.py")
SAMPLE_INPUT = os.path.join(BASE_DIR, "parser", "sample_events.json")
PARSED_LOG = os.path.join(BASE_DIR, "logs", "parsed_events.json")

# Ensure parser import for direct summary generation
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

try:
    from parser.event_summary import compute_summary_metrics
    from parser.traffic_parser import validate_event
except ImportError:
    compute_summary_metrics = None
    validate_event = None

app = FastAPI(
    title="API-Sentinel Telemetry API",
    version="1.0.0",
    description="Backend engine for Runtime BOLA & Shadow API Detection"
)

# CORS Middleware — restricted to local Vite development origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Concurrency lock to prevent overlapping parser triggers
parser_lock = asyncio.Lock()


def load_parsed_events_safely() -> List[Dict[str, Any]]:
    """
    Safely loads and validates events from logs/parsed_events.json.
    Returns an empty list if the file is absent or empty.
    """
    if not os.path.exists(PARSED_LOG):
        return []

    try:
        with open(PARSED_LOG, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                # Filter through validator if available
                if validate_event:
                    valid_events = []
                    for ev in data:
                        is_valid, _, norm = validate_event(ev)
                        if is_valid and norm:
                            valid_events.append(norm)
                    return valid_events
                return data
            return []
    except (json.JSONDecodeError, OSError):
        return []


@app.get("/api/v1/health")
async def health_check():
    """
    Reports backend health status, data source state, and parser availability.
    """
    events_exist = os.path.exists(PARSED_LOG)
    event_count = len(load_parsed_events_safely()) if events_exist else 0
    parser_ready = os.path.exists(PARSER_SCRIPT) and os.path.exists(SAMPLE_INPUT)

    return {
        "status": "ok",
        "version": "1.0.0",
        "mode": "live_backend",
        "parser_available": parser_ready,
        "parsed_events_available": events_exist,
        "event_count": event_count,
        "timestamp": os.path.getmtime(PARSED_LOG) if events_exist else None
    }


@app.get("/api/v1/events")
async def get_events():
    """
    Returns array of validated parsed security telemetry events.
    """
    events = load_parsed_events_safely()
    return {
        "success": True,
        "count": len(events),
        "events": events
    }


@app.get("/api/v1/metrics/summary")
async def get_summary_metrics():
    """
    Calculates summary metrics across currently parsed traffic events.
    """
    events = load_parsed_events_safely()
    if not events:
        return {
            "total_requests": 0,
            "methods": {},
            "endpoints": {},
            "status_categories": {
                "2xx": 0,
                "3xx": 0,
                "4xx": 0,
                "5xx": 0,
                "other": 0
            },
            "status_code_counts": {},
            "error_count": 0,
            "success_rate": 0.0,
            "potential_auth_review_count": 0,
            "uncataloged_endpoint_count": 0
        }

    if compute_summary_metrics:
        return compute_summary_metrics(events)

    # Basic fallback calculation if helper import failed
    return {
        "total_requests": len(events),
        "methods": {ev.get("method", "GET"): 1 for ev in events},
        "endpoints": {ev.get("endpoint", "/"): 1 for ev in events},
        "status_categories": {"2xx": len(events), "4xx": 0, "5xx": 0},
        "error_count": 0,
        "success_rate": 100.0,
        "potential_auth_review_count": 0,
        "uncataloged_endpoint_count": 0
    }


@app.post("/api/v1/parser/run")
async def run_parser_task():
    """
    Safely executes the Python traffic parser on parser/sample_events.json.
    Enforces concurrency lock and safe project-relative paths.
    """
    if parser_lock.locked():
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="A parser execution task is already in progress. Please wait."
        )

    async with parser_lock:
        if not os.path.exists(PARSER_SCRIPT):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Traffic parser script not found on backend."
            )

        if not os.path.exists(SAMPLE_INPUT):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sample event source file not found."
            )

        try:
            # Run parser in a subprocess using current Python executable
            proc = await asyncio.create_subprocess_exec(
                sys.executable,
                PARSER_SCRIPT,
                SAMPLE_INPUT,
                PARSED_LOG,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=10.0)

            if proc.returncode != 0:
                err_msg = stderr.decode().strip() or "Parser process exited with error."
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Parser execution failed: {err_msg}"
                )

            events = load_parsed_events_safely()
            return {
                "success": True,
                "message": "Traffic parser executed successfully.",
                "total_events_loaded": len(events),
                "output_file": "logs/parsed_events.json"
            }

        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Parser execution timed out after 10 seconds."
            )
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Subprocess dispatch error: {str(e)}"
            )


@app.get("/api/v1/endpoints")
async def get_endpoints_inventory():
    """
    Returns inventory of endpoints derived from parsed traffic.
    """
    events = load_parsed_events_safely()
    endpoints_map: Dict[str, Dict[str, Any]] = {}

    for ev in events:
        key = f"{ev.get('method', 'GET')} {ev.get('endpoint', '/')}"
        if key not in endpoints_map:
            ep = ev.get("endpoint", "/")
            is_undoc = "unknown" in ep.lower()
            endpoints_map[key] = {
                "id": f"EP-DERIVED-{len(endpoints_map) + 1:03d}",
                "method": ev.get("method", "GET"),
                "endpoint": ep,
                "requestCount": 1,
                "lastStatusCode": ev.get("status_code", 200),
                "docStatus": "Undocumented Candidate" if is_undoc else "Documented",
                "riskStatus": "Review Required" if (is_undoc or ev.get("status_code", 200) >= 400) else "Normal",
                "description": f"Derived from parsed runtime traffic ({ev.get('source_ip', '127.0.0.1')})"
            }
        else:
            endpoints_map[key]["requestCount"] += 1

    return {
        "success": True,
        "count": len(endpoints_map),
        "endpoints": list(endpoints_map.values())
    }


@app.get("/api/v1/detections/shadow-apis")
async def get_shadow_api_candidates():
    """
    Returns uncataloged route candidates observed in network traffic.
    """
    events = load_parsed_events_safely()

    shadow_events = [
        ev for ev in events
        if (
            "unknown" in ev.get("endpoint", "").lower()
            or ev.get("status_code") == 404
            or ev.get("documented") is False
        )
    ]

    return {
        "success": True,
        "count": len(shadow_events),
        "candidates": shadow_events
    }


@app.get("/api/v1/detections/bola")
async def get_bola_candidates():
    """
    Returns potential authorization review candidates (e.g. user/owner mismatches).
    """
    events = load_parsed_events_safely()
    candidates = []
    for ev in events:
        u_auth = ev.get("authenticated_user_id")
        u_owner = ev.get("object_owner_id")
        if u_auth and u_owner and u_auth != u_owner:
            candidates.append({
                **ev,
                "detection_type": "Potential Authorization Review Candidate",
                "note": f"Mismatched user context (auth: {u_auth}, owner: {u_owner}). Subject to authorization-policy verification."
            })

    return {
        "success": True,
        "count": len(candidates),
        "candidates": candidates
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

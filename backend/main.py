"""
API-Sentinel — FastAPI Backend Gateway (Week 3 Deliverable)

Exposes REST endpoints consumed by the React SOC Dashboard,
coordinates parser execution via safe subprocess dispatch,
and aggregates runtime telemetry from logs/parsed_events.json.
"""

import os
import sys
import json
import re
import asyncio
import subprocess
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Project directory paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARSER_SCRIPT = os.path.join(BASE_DIR, "parser", "traffic_parser.py")
SAMPLE_INPUT = os.path.join(BASE_DIR, "parser", "sample_events.json")
JSONL_INPUT = os.path.join(BASE_DIR, "logs", "traffic.jsonl")
PARSED_LOG = os.path.join(BASE_DIR, "logs", "parsed_events.json")
DOCUMENTED_FILE = os.path.join(BASE_DIR, "Documented_endpoints.json")

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


def load_documented_endpoints() -> List[Dict[str, str]]:
    """
    Loads officially cataloged API endpoints from Documented_endpoints.json.
    """
    if not os.path.exists(DOCUMENTED_FILE):
        return []
    try:
        with open(DOCUMENTED_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("endpoints", [])
    except (json.JSONDecodeError, OSError):
        return []


def is_route_documented(method: str, path: str, documented: List[Dict[str, str]]) -> bool:
    """
    Checks if an observed (method, path) matches the documented catalog,
    supporting path parameter placeholders such as <int:id> or {id}.
    """
    norm_m = (method or "GET").strip().upper()
    for doc in documented:
        if doc.get("method", "").strip().upper() != norm_m:
            continue
        doc_path = doc.get("path", "")
        pattern = re.sub(r"<[^>]+>", r"[^/]+", doc_path)
        pattern = re.sub(r"\{[^}]+\}", r"[^/]+", pattern)
        pattern = f"^{pattern}$"
        if re.match(pattern, path):
            return True
    return False


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
async def get_events(limit: Optional[int] = None, offset: int = 0):
    """
    Returns array of validated parsed security telemetry events,
    with optional pagination support.
    """
    events = load_parsed_events_safely()
    total = len(events)
    paged = events
    if offset > 0:
        paged = paged[offset:]
    if limit is not None and limit >= 0:
        paged = paged[:limit]
    return {
        "success": True,
        "total": total,
        "count": len(paged),
        "offset": offset,
        "limit": limit,
        "events": paged
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
async def run_parser_task(source: Optional[str] = None):
    """
    Safely executes the Python traffic parser.
    Supports source='captured' (logs/traffic.jsonl) or source='sample' (parser/sample_events.json).
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

        target_input = SAMPLE_INPUT
        if source in ("captured", "traffic", "live"):
            target_input = JSONL_INPUT
        elif source == "sample":
            target_input = SAMPLE_INPUT

        if not os.path.exists(target_input):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target event source file not found: {os.path.basename(target_input)}."
            )

        try:
            # Run parser in a subprocess using current Python executable
            proc = await asyncio.create_subprocess_exec(
                sys.executable,
                PARSER_SCRIPT,
                target_input,
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
                "message": f"Traffic parser executed successfully using {os.path.basename(target_input)}.",
                "source_used": os.path.basename(target_input),
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
    Cross-checks against documented OpenAPI endpoints when catalog is available.
    """
    events = load_parsed_events_safely()
    documented = load_documented_endpoints()
    endpoints_map: Dict[str, Dict[str, Any]] = {}

    for ev in events:
        key = f"{ev.get('method', 'GET')} {ev.get('endpoint', '/')}"
        ep = ev.get("endpoint", "/")
        m = ev.get("method", "GET").upper()
        sc = ev.get("status_code", 200)

        is_doc = (ev.get("documented") is True) or (is_route_documented(m, ep, documented) if documented else ("unknown" not in ep.lower()))
        if ev.get("documented") is False:
            is_doc = False
        is_undoc = not is_doc

        if key not in endpoints_map:
            endpoints_map[key] = {
                "id": f"EP-DERIVED-{len(endpoints_map) + 1:03d}",
                "method": m,
                "endpoint": ep,
                "requestCount": 1,
                "lastStatusCode": sc,
                "docStatus": "Undocumented Candidate" if is_undoc else "Documented",
                "riskStatus": "Review Required" if (is_undoc or sc >= 400) else "Normal",
                "description": f"Derived from parsed runtime traffic ({ev.get('source_ip', '127.0.0.1')})"
            }
        else:
            endpoints_map[key]["requestCount"] += 1
            endpoints_map[key]["lastStatusCode"] = sc

    return {
        "success": True,
        "count": len(endpoints_map),
        "endpoints": list(endpoints_map.values())
    }


@app.get("/api/v1/detections/shadow-apis")
async def get_shadow_api_candidates():
    """
    Returns uncataloged route candidates observed in network traffic.
    Maintains full schema compatibility with prior tests while adding structured candidate metadata.
    """
    events = load_parsed_events_safely()
    documented = load_documented_endpoints()
    candidates = []

    for ev in events:
        ep = ev.get("endpoint", "")
        m = ev.get("method", "GET").upper()
        sc = ev.get("status_code", 200)

        is_doc = (ev.get("documented") is True) or (is_route_documented(m, ep, documented) if documented else ("unknown" not in ep.lower()))
        if ev.get("documented") is False:
            is_doc = False
        is_shadow = not is_doc or sc == 404 or "unknown" in ep.lower()

        if is_shadow:
            candidates.append({
                **ev,
                "id": f"SHADOW-CANDIDATE-{len(candidates) + 1:03d}",
                "event_id": ev.get("event_id") or f"EVT-SHADOW-{len(candidates) + 1:03d}",
                "detection_type": "Uncataloged Route Observation",
                "catalog_status": "Undocumented Candidate",
                "classification": "Undocumented Active Route" if sc < 400 else "Unknown Route Scan / 404",
                "severity": "MEDIUM" if sc < 400 else "LOW",
                "status": "Under Review",
                "note": f"HTTP {sc} observed on uncataloged path {ep}. Requires OpenAPI schema verification.",
                "remediation": "Audit routing tables and compare against the official OpenAPI specification."
            })

    return {
        "success": True,
        "count": len(candidates),
        "candidates": candidates
    }


@app.get("/api/v1/detections/bola")
async def get_bola_candidates():
    """
    Returns potential authorization review candidates (e.g. user/owner mismatches).
    Maintains full schema compatibility with prior tests while adding structured finding metadata.
    """
    events = load_parsed_events_safely()
    candidates = []
    for ev in events:
        u_auth = ev.get("authenticated_user_id")
        u_owner = ev.get("object_owner_id")
        if u_auth and u_owner and str(u_auth) != str(u_owner):
            candidates.append({
                **ev,
                "id": f"BOLA-CANDIDATE-{len(candidates) + 1:03d}",
                "event_id": ev.get("event_id") or f"EVT-BOLA-{len(candidates) + 1:03d}",
                "detection_type": "Potential Authorization Review Candidate",
                "severity": "HIGH",
                "status": "Under Review",
                "note": f"Mismatched user context (auth: {u_auth}, owner: {u_owner}). Subject to authorization-policy verification.",
                "remediation": "Enforce object-level access control checks (ACL/RBAC) in route handlers before data mutation or retrieval."
            })

    return {
        "success": True,
        "count": len(candidates),
        "candidates": candidates
    }


@app.get("/api/v1/telemetry")
async def get_telemetry():
    """
    Aggregates runtime events into time-series telemetry buckets
    for visualization in the SOC dashboard traffic chart.
    """
    events = load_parsed_events_safely()
    if not events:
        return {
            "success": True,
            "count": 0,
            "series": []
        }

    documented = load_documented_endpoints()
    buckets: Dict[str, Dict[str, Any]] = {}

    for ev in events:
        ts = ev.get("timestamp") or "2026-10-09T10:00:00"
        time_clean = ts.replace("T", " ")
        time_label = time_clean[11:19] if len(time_clean) >= 19 else (time_clean[11:16] if len(time_clean) >= 16 else time_clean)

        if time_label not in buckets:
            buckets[time_label] = {
                "time": time_label,
                "total": 0,
                "documented": 0,
                "shadow": 0,
                "flagged": 0,
                "get": 0,
                "post": 0,
                "put": 0,
                "delete": 0
            }

        b = buckets[time_label]
        b["total"] += 1

        m = ev.get("method", "GET").upper()
        if m == "GET":
            b["get"] += 1
        elif m == "POST":
            b["post"] += 1
        elif m == "PUT":
            b["put"] += 1
        elif m == "DELETE":
            b["delete"] += 1

        ep = ev.get("endpoint", "")
        sc = ev.get("status_code", 200)
        u_auth = ev.get("authenticated_user_id")
        u_owner = ev.get("object_owner_id")

        is_doc = (ev.get("documented") is True) or (is_route_documented(m, ep, documented) if documented else ("unknown" not in ep.lower()))
        if ev.get("documented") is False:
            is_doc = False
        is_shadow = not is_doc or sc == 404 or "unknown" in ep.lower()
        is_flagged = bool(u_auth and u_owner and str(u_auth) != str(u_owner)) or sc >= 400

        if is_shadow:
            b["shadow"] += 1
        else:
            b["documented"] += 1

        if is_flagged:
            b["flagged"] += 1

    series = list(buckets.values())
    return {
        "success": True,
        "count": len(series),
        "series": series
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

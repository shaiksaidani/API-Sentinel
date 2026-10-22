
import json
import os

PROJECT_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

INPUT_FILE = os.path.join(
    PROJECT_DIR, "logs", "parsed_events.json"
)


def compute_summary_metrics(events):
    """Calculate API traffic summary metrics for tests and the backend."""
    methods = {}
    endpoints = {}
    status_categories = {"2xx": 0, "4xx": 0, "5xx": 0}
    error_count = 0
    potential_auth_review_count = 0

    for event in events:
        method = event.get("method", "UNKNOWN")
        endpoint = event.get("endpoint", event.get("path", "UNKNOWN"))

        methods[method] = methods.get(method, 0) + 1
        endpoints[endpoint] = endpoints.get(endpoint, 0) + 1

        try:
            status = int(event.get("status_code", 0))
        except (ValueError, TypeError):
            status = 0

        if 200 <= status < 300:
            status_categories["2xx"] += 1
        elif 400 <= status < 500:
            status_categories["4xx"] += 1
            error_count += 1
        elif 500 <= status < 600:
            status_categories["5xx"] += 1
            error_count += 1

        if status == 0:
            continue
        if 300 <= status < 400:
            continue
        if 100 <= status < 200:
            continue
        if 400 <= status < 600 and status < 500:
            # Count client errors too; error_count is counted above.
            pass

        user_id = event.get("authenticated_user_id")
        owner_id = event.get("object_owner_id")
        if user_id is not None and owner_id is not None and user_id != owner_id:
            potential_auth_review_count += 1

    total = len(events)
    success_rate = status_categories["2xx"] * 100.0 / total if total else 0.0

    return {
        "total_requests": total,
        "methods": methods,
        "endpoints": endpoints,
        "status_categories": status_categories,
        "error_count": error_count,
        "success_rate": success_rate,
        "potential_auth_review_count": potential_auth_review_count,
    }


def main():
    with open(INPUT_FILE, "r") as file:
        events = json.load(file)

    methods = {}
    statuses = {}
    endpoints = {}

    success_count = 0
    client_error_count = 0
    server_error_count = 0
    error_count = 0

    for event in events:
        method = event["method"]
        status = event["status_code"]
        endpoint = event["endpoint"]

        # Count methods, statuses, and endpoints
        methods[method] = methods.get(method, 0) + 1
        statuses[status] = statuses.get(status, 0) + 1
        endpoints[endpoint] = endpoints.get(endpoint, 0) + 1

        # Count response categories
        if 200 <= status < 300:
            success_count += 1
        elif 400 <= status < 500:
            client_error_count += 1
        elif 500 <= status < 600:
            server_error_count += 1

    print("\nAPI TRAFFIC SUMMARY")
    print("-------------------")
    print("\nTotal API requests:", len(events))

    print("\nHTTP methods:")
    for method, count in methods.items():
        print(method, ":", count)

    print("\nStatus codes:")
    for status, count in statuses.items():
        print(status, ":", count)

    print("\nEndpoint request counts:")
    for endpoint, count in endpoints.items():
        print(endpoint, ":", count)

    print("\nEndpoints with HTTP errors:")

    for event in events:
        if event["status_code"] >= 400:
            error_count += 1
            print(
                event["endpoint"],
                "- Status:",
                event["status_code"]
            )

    print("\nTotal HTTP error responses:", error_count)

    print("\nResponse category summary:")
    print("Successful responses (2xx):", success_count)
    print("Client errors (4xx):", client_error_count)
    print("Server errors (5xx):", server_error_count)

    if len(events) > 0:
        success_percentage = success_count * 100 / len(events)
    else:
        success_percentage = 0

    print(
        "Successful response rate: {:.2f}%".format(
            success_percentage
        )
    )


if __name__ == "__main__":
    main()


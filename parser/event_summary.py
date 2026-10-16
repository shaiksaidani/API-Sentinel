
import json
import os

PROJECT_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

INPUT_FILE = os.path.join(
    PROJECT_DIR, "logs", "parsed_events.json"
)


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

        methods[method] = methods.get(method, 0) + 1
        statuses[status] = statuses.get(status, 0) + 1
        endpoints[endpoint] = endpoints.get(endpoint, 0) + 1

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

    if events:
        success_percentage = (
            success_count / len(events)
        ) * 100

        print(
            "Successful response rate: {:.2f}%".format(
                success_percentage
            )
        )
    else:
        print("Successful response rate: 0.00%")


if __name__ == "__main__":
    main()

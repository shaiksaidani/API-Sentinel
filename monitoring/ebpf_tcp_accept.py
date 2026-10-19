#!/usr/bin/env python3
"""Observe accepted IPv4 TCP connections with eBPF/BCC.

This reports TCP connection accepts, NOT individual HTTP requests. HTTP fields
are deliberately null because generic kernel TCP hooks cannot infer them.
Run on a supported Linux VM with BCC installed, as root/sudo.
"""
from __future__ import annotations

import argparse
import json
import os
import socket
import struct
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, TextIO

BPF_PROGRAM = r"""
#include <uapi/linux/ptrace.h>
#include <net/sock.h>
#include <bcc/proto.h>

struct event_t {
    u64 ts_ns;
    u32 pid;
    u32 remote_ip;
    u32 local_ip;
    u16 remote_port;
    u16 local_port;
    char comm[TASK_COMM_LEN];
};
BPF_PERF_OUTPUT(events);

int kretprobe__inet_csk_accept(struct pt_regs *ctx) {
    struct sock *sk = (struct sock *)PT_REGS_RC(ctx);
    if (sk == NULL) return 0;
    if (sk->__sk_common.skc_family != AF_INET) return 0;

    struct event_t event = {};
    event.ts_ns = bpf_ktime_get_ns();
    event.pid = bpf_get_current_pid_tgid() >> 32;
    event.remote_ip = sk->__sk_common.skc_daddr;
    event.local_ip = sk->__sk_common.skc_rcv_saddr;
    event.remote_port = ntohs(sk->__sk_common.skc_dport);
    event.local_port = sk->__sk_common.skc_num;
    bpf_get_current_comm(&event.comm, sizeof(event.comm));
    events.perf_submit(ctx, &event, sizeof(event));
    return 0;
}
"""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def network_event(remote_ip: str, local_ip: str, remote_port: int,
                  local_port: int, pid: int, process: str,
                  timestamp: str | None = None) -> dict[str, Any]:
    """Convert a TCP-accept observation into the shared API-Sentinel schema."""
    return {
        "method": None,
        "endpoint": None,
        "source_ip": remote_ip,
        "status_code": None,
        "timestamp": timestamp or utc_now(),
        "request_body": None,
        "event_type": "tcp_connection_accepted",
        "transport": "TCP",
        "local_ip": local_ip,
        "local_port": int(local_port),
        "remote_port": int(remote_port),
        "pid": int(pid),
        "process": process,
        "data_source": "eBPF/BCC inet_csk_accept",
    }


def ipv4_from_u32(value: int) -> str:
    # Matches the native-endian address representation used by BCC's tcpaccept tool.
    return socket.inet_ntop(socket.AF_INET, struct.pack("I", value))


def write_jsonl(event: dict[str, Any], output: TextIO) -> None:
    output.write(json.dumps(event, separators=(",", ":")) + "\n")
    output.flush()


def run(args: argparse.Namespace) -> int:
    try:
        from bcc import BPF  # type: ignore
    except ImportError:
        print("BCC Python bindings are missing. Install python3-bpfcc and run with /usr/bin/python3.", file=sys.stderr)
        return 2

    if os.geteuid() != 0:
        print("This eBPF monitor needs root privileges; rerun with sudo.", file=sys.stderr)
        return 2

    try:
        bpf = BPF(text=BPF_PROGRAM)
    except Exception as exc:
        print(f"Could not load eBPF program: {exc}\nCheck kernel headers, BCC, and kernel support.", file=sys.stderr)
        return 2

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    out = output_path.open("a", encoding="utf-8")
    print(f"Monitoring accepted IPv4 TCP connections; output: {output_path}")
    print("HTTP method/path/status/body are not available from this hook; press Ctrl+C to stop.")

    def on_event(cpu: int, data: Any, size: int) -> None:
        event = bpf["events"].event(data)
        local_port = int(event.local_port)
        if args.port is not None and local_port != args.port:
            return
        comm = bytes(event.comm).split(b"\0", 1)[0].decode("utf-8", errors="replace")
        record = network_event(
            remote_ip=ipv4_from_u32(event.remote_ip),
            local_ip=ipv4_from_u32(event.local_ip),
            remote_port=int(event.remote_port),
            local_port=local_port,
            pid=int(event.pid),
            process=comm,
        )
        write_jsonl(record, out)
        print(json.dumps(record))

    bpf["events"].open_perf_buffer(on_event)
    try:
        while True:
            bpf.perf_buffer_poll()
    except KeyboardInterrupt:
        print("Stopping monitor.")
    finally:
        out.close()
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, help="only write connections accepted on this local TCP port")
    parser.add_argument("--output", default="logs/network_events.jsonl", help="append JSONL events to this file")
    return run(parser.parse_args())


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env bash
# run-with-log-rotation.sh - example runner that owns log redirection and rotation.
#
# Demonstrates the log-output policy in docs/architecture/observability.md:
# the program always writes to stdout/stderr and never rotates its own logs;
# redirecting to a file and rotating it is the runner's job. Copy this script
# (with its companion log-prune.sh) into a product repo's scripts/ and adapt.
#
# Modeled on the runner used by the llmeds service: in file mode, stdout and
# stderr are merged and piped through Apache rotatelogs, which rotates by
# size, keeps a stable latest.log symlink, and calls log-prune.sh after each
# rotation to bound the number of files kept.
#
# Under Docker or systemd, do NOT use file mode: run in console mode and let
# the Docker log driver (json-file max-size/max-file) or journald do the
# capture and rotation.
#
# Usage:
#   scripts/run-with-log-rotation.sh [--] <command> [args...]
#
#   LOG_OUTPUT=console scripts/run-with-log-rotation.sh -- node dist/server.js
#   LOG_OUTPUT=file LOG_DIR=/var/log/myapp \
#       scripts/run-with-log-rotation.sh -- node dist/server.js
#
# Environment:
#   LOG_OUTPUT      console | file   (default: console — plain passthrough)
#   LOG_DIR         directory for rotated files   (default: ./logs/$LOG_FILE_SIG)
#   LOG_FILE_SIG    filename prefix for rotated files   (default: app)
#   LOG_SIZE_LIMIT  rotation threshold, rotatelogs syntax   (default: 10M)
#   LOG_FILE_LIMIT  rotated files to keep; older ones are pruned   (default: 50)
#
# File mode requires rotatelogs (ships with Apache httpd: `apache2-utils` on
# Debian/Ubuntu, `httpd` on RHEL, preinstalled on macOS).

set -e -u -o pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "${1:-}" = "--" ]; then
    shift
fi
if [ $# -eq 0 ]; then
    echo "Usage: $0 [--] <command> [args...]" >&2
    exit 1
fi

LOG_OUTPUT=${LOG_OUTPUT:-console}

if [ "${LOG_OUTPUT}" = "console" ]; then
    # Default: the program's stdout/stderr flow through untouched, for the
    # terminal, Docker log driver, or journald to capture.
    exec "$@"
fi

if [ "${LOG_OUTPUT}" != "file" ]; then
    echo "LOG_OUTPUT must be 'console' or 'file', got: ${LOG_OUTPUT}" >&2
    exit 1
fi

if ! command -v rotatelogs >/dev/null 2>&1; then
    echo "LOG_OUTPUT=file requires rotatelogs (apache2-utils / httpd package)." >&2
    exit 1
fi

LOG_FILE_SIG=${LOG_FILE_SIG:-app}
LOG_SIZE_LIMIT=${LOG_SIZE_LIMIT:-10M}
LOG_FILE_LIMIT=${LOG_FILE_LIMIT:-50}
LOG_DIR=${LOG_DIR:-"$(pwd)/logs/${LOG_FILE_SIG}"}
mkdir -p "${LOG_DIR}"

# The prune hook reads these from the environment (rotatelogs -p passes only
# filenames as arguments).
export LOG_DIR LOG_FILE_SIG LOG_FILE_LIMIT

echo "Logging to ${LOG_DIR}/${LOG_FILE_SIG}.<timestamp>.log" \
     "(latest: ${LOG_DIR}/latest.log, rotate at ${LOG_SIZE_LIMIT}," \
     "keep ${LOG_FILE_LIMIT})" >&2

# -L: maintain a stable symlink to the current file
# -f: open the log file immediately, before the first write
# -c: create the file even if no output arrives in an interval
# -p: run the prune hook after each rotation
# The filename pattern must be second-granular (%S): on a size-triggered
# rotation, rotatelogs reopens whatever the pattern resolves to, and a
# coarser pattern resolves to the same name, silently appending past the
# size limit instead of rotating.
"$@" 2>&1 | rotatelogs \
    -L "${LOG_DIR}/latest.log" -f -c \
    -p "${DIR}/log-prune.sh" \
    "${LOG_DIR}/${LOG_FILE_SIG}.%Y-%m-%d-%H-%M-%S.log" "${LOG_SIZE_LIMIT}"

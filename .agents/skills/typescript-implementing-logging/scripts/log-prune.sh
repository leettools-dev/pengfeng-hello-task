#!/usr/bin/env bash
# log-prune.sh - post-rotation hook for run-with-log-rotation.sh.
#
# rotatelogs invokes this after each rotation. It deletes the oldest rotated
# files beyond LOG_FILE_LIMIT so disk use stays bounded — the "rotation is the
# runner's job" half of the policy in docs/architecture/observability.md.
# Expects LOG_DIR, LOG_FILE_SIG, and LOG_FILE_LIMIT in the environment,
# exported by the runner.

set -e -u

logFileLimit=${LOG_FILE_LIMIT:-50}
logFileSig=${LOG_FILE_SIG:?LOG_FILE_SIG must be exported by the runner}
logDir=${LOG_DIR:?LOG_DIR must be exported by the runner}

# ls -t (newest first) is portable to macOS, unlike GNU `find -printf`;
# rotated filenames come from the runner's pattern and contain no spaces.
ls -1t "${logDir}/${logFileSig}".*.log 2>/dev/null \
    | tail -n +$((logFileLimit + 1)) \
    | while read -r oldLog; do
        echo "Pruning rotated log ${oldLog} (keep limit ${logFileLimit})"
        rm -f "${oldLog}"
    done

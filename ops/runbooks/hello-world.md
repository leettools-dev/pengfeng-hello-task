# Runbook: Hello World Baseline

## Symptom

`GET /health` does not return 200.

## Checks

1. Confirm the process is running.
2. Confirm `PORT` and `HOST` match the environment.
3. Run `npm test` to verify the handler still works without the network layer.

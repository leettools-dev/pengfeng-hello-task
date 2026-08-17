---
name: general-handling-errors
description: "Design robust error handling with clear hierarchies, logging, and recovery patterns"
layer: lifecycle
peers:
  - general-designing-apis
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Handling Errors

## Overview

This skill covers error handling strategies including exception hierarchies, error logging, recovery patterns, and user-friendly error messages. Good error handling makes applications robust and debuggable.

Use this skill when:
- Designing exception classes
- Implementing error recovery logic
- Logging and monitoring errors
- Creating user-facing error messages

Prerequisites: None (general best practice)

## Key Concepts

**Error Hierarchy:**
- Base exception for application-specific errors
- Specific exceptions for different error types
- Include context and helpful error messages
- Distinguish between recoverable and fatal errors

**Error Handling Strategies:**
- Fail fast: Detect and report errors immediately
- Fail gracefully: Handle errors without crashing
- Retry logic: Attempt operation again after transient failures
- Circuit breaker: Stop attempting after repeated failures

**Logging Best Practices:**
- Log errors with full context (stack trace, parameters)
- Use appropriate log levels (ERROR, WARNING, INFO)
- Include correlation IDs for distributed systems
- Don't log sensitive information

**Anti-patterns:**
- Empty catch blocks: Silently swallowing errors
- Generic exceptions: catch (Exception e) without specificity
- Error codes instead of exceptions
- Logging without context

## Implementation Guide

### Step 1: Define Exception Hierarchy
Create base exception class:
```
AppException (base)
├── ValidationException
├── NotFoundException
├── AuthenticationException
├── AuthorizationException
├── ConflictException
└── InternalException
```

### Step 2: Include Error Context
Every exception should include:
- Error message: What went wrong
- Error code: For client identification
- Context: Parameters, state that caused error
- Original cause: Wrapped exception if applicable

### Step 3: Choose Recovery Strategy
Determine how to handle each error type:
- Retry: Network timeouts, rate limits
- Fallback: Use cached data, default values
- Fail gracefully: Return partial results, user-friendly message
- Fail fast: Invalid inputs, programming errors

### Step 4: Log Appropriately
Use structured logging:
```
ERROR: Unrecoverable errors requiring attention
WARNING: Recoverable errors or unexpected states
INFO: Normal application flow
DEBUG: Detailed diagnostic information
```

### Step 5: Return User-Friendly Messages
- Don't expose internal details
- Be specific about what went wrong
- Suggest next steps if possible
- Include support contact for critical errors

## Examples

### Minimal Example
```
try:
    result = risky_operation()
except SpecificException as e:
    logger.error(f"Operation failed: {e}")
    raise
```

### Common Use Case (Retry Logic)
```
max_retries = 3
for attempt in range(max_retries):
    try:
        return api_call()
    except TemporaryException as e:
        if attempt < max_retries - 1:
            wait_time = 2 ** attempt
            logger.warning(f"Retry {attempt + 1}/{max_retries} after {wait_time}s")
            time.sleep(wait_time)
        else:
            logger.error("Max retries exceeded")
            raise
```

### Advanced Pattern (Circuit Breaker)
```
class CircuitBreaker:
    def __init__(self, max_failures=5, timeout=60):
        self.max_failures = max_failures
        self.timeout = timeout
        self.failures = 0
        self.last_failure_time = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN

    def call(self, func, *args, **kwargs):
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.timeout:
                self.state = "HALF_OPEN"
            else:
                raise CircuitBreakerOpenException()

        try:
            result = func(*args, **kwargs)
            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failures = 0
            return result
        except Exception as e:
            self.failures += 1
            self.last_failure_time = time.time()
            if self.failures >= self.max_failures:
                self.state = "OPEN"
            raise
```

## Checklist

- [ ] Exception hierarchy defined with base class
- [ ] Each exception includes context and message
- [ ] Errors logged with appropriate level
- [ ] Sensitive information not logged
- [ ] User-facing errors are helpful
- [ ] Retry logic for transient failures
- [ ] Circuit breaker for repeated failures (if applicable)
- [ ] Stack traces preserved when re-raising
- [ ] Error monitoring/alerting configured
- [ ] Documentation of error codes

## References

See [references.md](references.md) for additional resources.

## Common Pitfalls

**Mistake 1: Empty catch blocks**
- Wrong: try { ... } catch (Exception e) { }
- Right: try { ... } catch (SpecificException e) { log and handle }
- Fix: Always handle or re-raise exceptions

**Mistake 2: Catching generic exceptions**
- Wrong: catch (Exception e) for all errors
- Right: catch (SpecificException e) for expected errors
- Fix: Only catch exceptions you can handle

**Mistake 3: Logging without context**
- Wrong: logger.error("Error occurred")
- Right: logger.error(f"Failed to process user {user_id}: {e}", exc_info=True)
- Fix: Include all relevant context in log messages

**Mistake 4: Exposing internal details to users**
- Wrong: "Database connection failed: Connection refused at 192.168.1.1:5432"
- Right: "Service temporarily unavailable. Please try again."
- Fix: Separate internal logs from user-facing messages

**Mistake 5: Not using exception chaining**
- Wrong: raise NewException("error") (loses original cause)
- Right: raise NewException("error") from original_exception
- Fix: Preserve exception chain for debugging

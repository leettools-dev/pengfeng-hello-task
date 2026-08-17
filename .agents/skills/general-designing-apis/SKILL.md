---
name: general-designing-apis
description: "REST API design patterns — endpoints, routes, routers, resources, HTTP methods, status codes, pagination, error responses, versioning. Use when designing, reviewing, or refactoring API endpoints."
layer: lifecycle
peers:
  - general-handling-errors
  - general-writing-commit-messages
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# API Design Conventions

Apply these conventions when designing or reviewing REST API endpoints.

## Resource URLs

- Plural nouns: `/users`, `/products`, `/order-items`
- Lowercase with hyphens: `/user-profiles` not `/userProfiles`
- Nest for ownership, max 2 levels: `/users/{id}/orders`
- For deeper resources, promote to top-level: `/order-items/{id}` not `/users/{id}/orders/{id}/items/{id}`
- Never use verbs: GET `/users/{id}` not GET `/getUser/{id}`

## HTTP Methods

| Method | Purpose | Idempotent | Response |
|--------|---------|------------|----------|
| GET | Retrieve | Yes | 200 with body |
| POST | Create | No | 201 with created resource |
| PUT | Full replace | Yes | 200 with updated resource |
| PATCH | Partial update | No | 200 with updated resource |
| DELETE | Remove | Yes | 204 no body |

## Status Codes

Use the correct code — never return 200 with an error in the body.

- **2xx**: 200 OK, 201 Created, 204 No Content
- **4xx**: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Validation Error, 429 Rate Limited
- **5xx**: 500 Internal Server Error, 503 Service Unavailable

## Error Response Format

Always return a consistent error structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": [{"field": "email", "issue": "Invalid format"}]
  }
}
```

## Pagination

All collection endpoints must support pagination. Prefer cursor-based for large/real-time datasets, offset-based for simpler cases.

```json
{
  "data": [...],
  "pagination": {
    "total": 1000,
    "limit": 50,
    "offset": 100,
    "has_more": true
  }
}
```

Support filtering and sorting via query params:
- Filter: `?status=active&role=admin`
- Sort: `?sort=-created_at` (prefix `-` for descending)
- Field selection: `?fields=id,name,email`

## Versioning

Use URL path versioning (`/api/v1/...`) only when introducing breaking changes. Do not version preemptively.

## Checklist

When designing or reviewing an API, verify:
- [ ] Resources are plural nouns, no verbs in URLs
- [ ] Correct HTTP methods and status codes
- [ ] Collections are paginated
- [ ] Error responses use consistent format
- [ ] Filtering/sorting supported where needed
- [ ] No nesting deeper than 2 levels

See [references.md](references.md) for external guides and specs.

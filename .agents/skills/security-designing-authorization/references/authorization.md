# Authorization

Authorization decides whether an authenticated principal may perform an
action on a resource in a specific context. Enforce it on the backend for
every request and background operation. Frontend guards are user experience,
not security boundaries.

## Policy Model

Use permissions as the application-facing vocabulary:

```text
document:read
document:create
document:update
document:delete
document:share
member:invite
billing:manage
```

Roles are named bundles of permissions, usually scoped to a tenant or
organization. Resource ownership, tenant membership, record relationships,
and request attributes may further constrain a permission.

```typescript
authorize(principal, "document:update", {
  tenantId,
  resource: document,
});
```

Avoid scattering checks such as `user.role === "admin"` through routes,
services, and components. Centralize policy evaluation behind a small,
testable interface.

## RBAC, ABAC, and ReBAC

- Use RBAC when stable job functions map cleanly to permissions.
- Add attribute checks for ownership, environment, time, data sensitivity, or
  approval state.
- Add relationship checks when access depends on membership, sharing, parent
  resources, or resource graphs.
- Do not encode every exception as a new role. Role explosion indicates the
  model needs attributes or relationships.

The default for multi-user products is tenant-scoped RBAC plus explicit
resource/relationship checks.

## Enforcement Rules

1. Deny by default.
2. Authenticate before loading protected data.
3. Establish tenant context from trusted membership, not solely from a
   client-supplied identifier.
4. Authorize the action against the target resource before returning or
   modifying it.
5. Apply tenant and visibility predicates in repository queries as defense in
   depth.
6. Authorize bulk operations item-by-item or through an equivalent constrained
   query.
7. Re-evaluate permissions for jobs, exports, webhooks, and service accounts.
8. Record sensitive grants, denials, role changes, impersonation, and
   destructive operations in the audit log.

Choose intentionally whether an inaccessible resource returns `403` or `404`;
avoid leaking resource existence across tenant boundaries.

## Authorization Matrix

Every protected domain must define:

| Principal/role | Scope | Action | Resource condition | Decision |
|----------------|-------|--------|--------------------|----------|
| member | tenant | `document:read` | document belongs to tenant | allow |
| member | tenant | `document:update` | principal owns document | allow |
| member | tenant | `document:update` | another member owns document | deny |
| admin | tenant | `document:update` | document belongs to tenant | allow |
| admin | other tenant | any | any | deny |

Use `templates/authorization-matrix.md` as the project artifact.

## Verification

For each protected action, test:

- anonymous principal
- authenticated principal without the permission
- each role expected to allow or deny
- owned and unowned resources
- same-tenant and cross-tenant resources
- guessed or substituted resource IDs
- role removal and membership changes
- bulk endpoints, exports, jobs, and indirect access paths

Policy tests should be table-driven. API and repository tests must prove the
policy is wired into every access path. Playwright should cover a small number
of representative role journeys, not serve as the only authorization test.

## Primary References

- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [NIST Role-Based Access Control](https://csrc.nist.gov/projects/role-based-access-control)
- [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/)

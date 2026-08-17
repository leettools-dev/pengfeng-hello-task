---
name: security-designing-authorization
description: "Design, implement, and test application authorization using scoped permissions, roles, attributes, relationships, tenant boundaries, centralized policy evaluation, repository constraints, and audit logs. Use for RBAC/ABAC/ReBAC decisions, multi-tenant data access, ownership rules, admin/support access, permission reviews, or authorization defects."
layer: lifecycle
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Designing Authorization

Read [the authorization guide](references/authorization.md) and fill
[the authorization matrix](assets/authorization-matrix.md).

## Process

1. Inventory principals, resources, actions, scopes, ownership, and
   relationships.
2. Name permissions as stable domain actions.
3. Use roles as scoped permission bundles, not as checks scattered through
   application code.
4. Add attribute or relationship constraints where a role alone is too broad.
5. Define a centralized policy interface and every enforcement point.
6. Apply tenant/resource constraints in repositories as defense in depth.
7. Define audit events and the `403` versus `404` disclosure policy.
8. Generate table-driven policy tests plus API, repository, and representative
   browser tests.

## Hard Rules

- Deny by default.
- Check every access path, including jobs, exports, webhooks, bulk operations,
  and service accounts.
- Never treat a frontend route guard or hidden control as enforcement.
- Never trust a client-supplied tenant or resource identifier without checking
  membership and access.
- Include cross-tenant and guessed-identifier negative tests.

The finished permission matrix and enforcement map belong in the dev spec or
its linked security design artifact.

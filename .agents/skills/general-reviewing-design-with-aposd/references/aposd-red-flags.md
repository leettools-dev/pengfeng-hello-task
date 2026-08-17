# APOSD Red Flags Reference

This is the detailed reference for `general-reviewing-design-with-aposd`.

Use these red flags as design smells. A smell does not always require immediate refactoring, but it should trigger deliberate review.

## 1. Shallow Module

### Definition

A module is shallow when its interface cost is high relative to the functionality or complexity it hides.

### Detection Heuristics

Flag a module if:

- it mostly forwards to another object or data structure
- it exposes many methods but each method is trivial
- callers still need to know internal details to use it correctly
- it wraps storage but adds almost no policy, validation, or abstraction

### Default Refactor

- merge the abstraction away, or
- deepen it by moving related logic, invariants, and decisions inside it

## 2. Information Leakage

### Definition

Information leakage occurs when a design decision that should be private to one module is known by other modules.

### Detection Heuristics

Flag code if:

- the same format, suffix, convention, or storage rule appears in multiple modules
- multiple modules know the same private schema detail
- private assumptions are duplicated in callers
- changing one internal convention would require edits in many places

### Default Refactor

- move private knowledge behind one owning module
- expose capability, not representation

## 3. Temporal Decomposition

### Definition

Temporal decomposition means organizing code by order of execution rather than by stable responsibility.

### Detection Heuristics

Flag code if:

- APIs are named around sequence: `step1`, `init_phase2`, `finalize_after_load`
- callers must remember a strict call order
- correctness depends on invisible "must happen before" conventions
- responsibility is split only because operations happen at different times

### Default Refactor

- move sequencing into a single owning abstraction
- expose higher-level operations instead of lifecycle choreography

## 4. Overexposure

### Definition

A module is overexposed when it reveals too much of its internal representation, policy, or implementation detail.

### Detection Heuristics

Flag APIs if:

- they expose storage terms, transport terms, or low-level internals
- the parameter list includes many implementation knobs
- callers must understand internals to use the API correctly
- the public surface mirrors the implementation structure too closely

### Default Refactor

- remove internal knobs from the public API
- expose only true variability points
- rename API boundaries in domain language

## 5. Pass-Through Method

### Definition

A pass-through method forwards a call without adding meaningful abstraction, validation, policy, or simplification.

### Detection Heuristics

Flag methods if:

- they do little more than call another method with the same arguments
- they add no invariants, translation, caching, logging, or policy
- removing them would not make the system harder to understand

### Default Refactor

- delete the layer, or
- make the layer own a real responsibility

## 6. Pass-Through Variable

### Definition

A pass-through variable is a parameter threaded through multiple functions even though intermediate functions do not conceptually use it.

### Detection Heuristics

Flag variables if:

- the same parameter appears across many layers unchanged
- intermediate code merely forwards it
- only one distant callee really needs it
- signatures become noisy with cross-cutting context

### Default Refactor

- move the variable to the correct owner
- use context mechanisms where appropriate
- redesign call boundaries to reduce threading

## 7. Conjunctions In Names

### Definition

Names containing conjunctions such as `and`, `or`, or `with` often indicate mixed responsibilities.

### Detection Heuristics

Flag names if they look like:

- `parse_and_validate`
- `fetch_or_create`
- `user_state_and_policy`
- `sync_with_retry_and_cache`

### Default Refactor

- split the responsibility, or
- rename around the true single responsibility

## 8. Inconsistent Interface

### Definition

An inconsistent interface exposes similar operations with different naming, parameter order, return behavior, or error handling.

### Detection Heuristics

Flag code if:

- related modules use different verbs for the same action
- argument ordering changes without reason
- similar methods return different shapes
- error behavior differs unexpectedly across equivalent APIs

### Default Refactor

- standardize naming
- standardize argument ordering
- standardize return and error conventions

## 9. Code Duplication

### Definition

Code duplication is repeated logic, repeated rules, or repeated structure that should be unified.

### Detection Heuristics

Flag duplication if:

- the same business rule appears in multiple places
- similar conditionals recur across handlers or services
- multiple copies must be updated together
- one bug fix likely implies more bug fixes elsewhere

### Default Refactor

- extract shared rules
- centralize invariant checks
- prefer reuse of policy, not just reuse of syntax

## 10. Special-General Mix

### Definition

A special-general mix happens when general-purpose code contains special-case logic for one client, one feature, or one scenario.

### Detection Heuristics

Flag code if:

- a supposedly general module contains product-specific flags
- a shared function has branches named after one client or feature
- one-off behavior is embedded in common infrastructure
- the general API grows knobs for isolated exceptions

### Default Refactor

- keep general mechanisms general
- move one-off cases to composition layers or specific adapters

## 11. Unusually Many Errors

### Definition

A region of code with unusually many errors is a design warning sign.

### Detection Heuristics

Flag code if:

- the same module receives repeated bug-fix commits
- edge-case patches accumulate over time
- incident history clusters around one utility or boundary
- code needs repeated defensive corrections

### Default Refactor

- perform root-cause redesign
- reduce special cases
- simplify the model instead of extending the patch stack

## 12. Hard To Pick A Name

### Definition

If something is hard to name clearly, it may not represent a clean concept.

### Detection Heuristics

Flag code if names are:

- vague
- overloaded
- very long
- full of qualifiers
- impossible to make both precise and concise

### Default Refactor

- split the concept
- rename based on concrete responsibility
- avoid creating abstractions before the concept is crisp

## Global Checklist

Before adding a new abstraction, method, or module, check:

1. Does this reduce system-wide complexity?
2. Does it hide complexity or just move it?
3. Does it localize knowledge?
4. Does it force callers to know ordering or internals?

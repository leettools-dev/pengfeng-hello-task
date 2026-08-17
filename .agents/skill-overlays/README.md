# Skill Overlays

Product-specific additions to installed skills live here. An overlay refines a
skill that already exists; it never defines one. The `skill-instantiate`
command installs each selected skill from the repo that owns it, then appends:

1. this product overlay, if `<skill-name>.md` exists here,
2. matching fragments from sibling repos declared in `.agents/toolchain.json`.

Skills themselves come from whichever source owns them — this scaffold's guide
package or a sibling utility repo — and land in `.agents/skills/`.

Write one file per skill using `<skill-name>.md`. Optional frontmatter can add
to the generated skill description:

```md
---
description_append: Product-specific review guidance for billing changes.
---

## Product-Specific Instructions

- Check billing tenant isolation before approving a change.
```

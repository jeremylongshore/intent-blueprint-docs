# Acknowledgments

## gstack

Several patterns in this project were adapted from [gstack](https://github.com/garrytan/gstack)
by Garry Tan, licensed under the MIT License.

Specifically, the following were inspired by gstack's engineering workflow automation:

- **Template build system** (`scripts/gen-skill-docs.ts`) — Adapted from gstack's
  `.tmpl` → `.md` pipeline with `{{PLACEHOLDER}}` resolution
- **Review skills** (`review-docs`, `review-architecture`) — Adapted from gstack's
  `plan-ceo-review` and `plan-eng-review` cognitive patterns
- **Ship workflow** (`ship`) — Adapted from gstack's ship skill (validate, bump, changelog, PR)
- **Document release** (`document-release`) — Adapted from gstack's post-ship documentation sync
- **QA methodology** (`qa-docs`) — Adapted from gstack's `qa-only` report-only audit approach
- **LLM-judge testing** (`test/helpers/llm-judge.ts`) — Adapted from gstack's eval infrastructure
- **Review checklist** (`review/doc-checklist.md`) — Adapted from gstack's pre-landing review checklist

All adapted code carries attribution headers:

```html
<!-- Portions adapted from gstack (https://github.com/garrytan/gstack) -->
<!-- Original: MIT License, Copyright (c) Garry Tan -->
```

MIT (gstack) → Apache 2.0 (intent-blueprint-docs) license compatibility confirmed.

## Intent Solutions

Built by [Intent Solutions](https://intentsolutions.io) — Jeremy Longshore.

# Legacy corpus migration

The 22 historical templates are broad reference playbooks. They contain useful checklists but also hard-coded stacks, fictional people, sample scores, prices, thresholds, survey results, and deployment scripts.

During migration:

1. Keep `professional-templates/core` as the canonical historical corpus.
2. Generate `packages/cli/templates/core` with `npm run templates:sync`; never edit that mirror directly.
3. Prepend the shared project/provenance envelope when rendering.
4. Treat all embedded values as illustrative until verified.
5. Move reusable controls into governed modules and examples into labeled packs.
6. Replace templates incrementally with schema-backed sections and traceability tests.

The detailed dispositions and modernization phases live in `000-docs/011-AT-AUDT-template-system-modernization.md`.

# Template previews

[Browse all 22 templates in the main README](../../README.md#browse-the-templates).

These are unedited draft workbooks from the current schema renderer, generated on 2026-10-22 using the fictional mobile dog-grooming booking idea in [context.json](context.json). The comprehensive scope is used to show every template; a real project can use a smaller set.

They show the initial structure, evidence register, assumptions, unknowns, and human-review requirements. They are not completed project analysis, verified business findings, or approved documents. The assistant develops these drafts using project-specific answers and sources.

To regenerate after changing the engine, run from the repository root:

```bash
npm ci
npm run build
node --input-type=module <<'JS'
import { readFileSync, writeFileSync } from 'node:fs';
import { TEMPLATE_DEFINITIONS, renderSchemaBlueprint } from './packages/cli/dist/index.js';
const context = JSON.parse(readFileSync('examples/template-previews/context.json', 'utf8'));
for (const template of TEMPLATE_DEFINITIONS) {
  const { content } = renderSchemaBlueprint(template.id, context);
  writeFileSync(`examples/template-previews/${template.filename}`, content);
}
JS
```

The fixed generation timestamp makes the previews reproducible. The historical long-form templates remain in [professional-templates/core](../../professional-templates/core/); they differ from these current default drafts.

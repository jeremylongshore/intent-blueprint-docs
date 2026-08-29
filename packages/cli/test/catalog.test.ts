import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  BLUEPRINT_MODULE_BY_ID,
  EXAMPLE_PACK_BY_ID,
  LEGACY_TEMPLATE_MIGRATIONS,
  TEMPLATE_DEFINITIONS,
  TemplateDefinitionSchema,
  getTemplatesDir,
  validateTemplateCatalog,
} from '../src/core/index.js';

describe('typed template catalog', () => {
  it('is the exact one-to-one authority for the 22 canonical files', () => {
    expect(() => validateTemplateCatalog(getTemplatesDir())).not.toThrow();
    expect(TEMPLATE_DEFINITIONS).toHaveLength(22);
    expect(new Set(TEMPLATE_DEFINITIONS.map(item => item.filename)).size).toBe(22);
  });

  it('preserves every historical ID and filename in an explicit migration map', () => {
    expect(LEGACY_TEMPLATE_MIGRATIONS).toHaveLength(22);
    expect(LEGACY_TEMPLATE_MIGRATIONS.map(item => item.legacyId)).toEqual(TEMPLATE_DEFINITIONS.map(item => item.id));
    for (const migration of LEGACY_TEMPLATE_MIGRATIONS) {
      expect(migration.currentId).toBe(migration.legacyId);
      expect(migration.legacyFilename).toBe(`${migration.legacyId}.md`);
      expect(migration.status).toBe('schema-default-legacy-opt-in');
    }
  });

  it('parses every definition and resolves every module and example pack', () => {
    for (const definition of TEMPLATE_DEFINITIONS) {
      expect(TemplateDefinitionSchema.parse(definition)).toEqual(definition);
      expect(definition.filename).toBe(`${definition.id}.md`);
      expect(definition.scopes).toContain('comprehensive');
      definition.modules.forEach(id => expect(BLUEPRINT_MODULE_BY_ID.has(id)).toBe(true));
      definition.examplePacks.forEach(id => expect(EXAMPLE_PACK_BY_ID.has(id)).toBe(true));
    }
    expect(new Set(TEMPLATE_DEFINITIONS.map(item => item.documentType)).size).toBe(22);
  });

  it('marks every example as illustrative, opt-in, and invalid as evidence', () => {
    for (const example of EXAMPLE_PACK_BY_ID.values()) {
      expect(example).toMatchObject({ illustrative: true, includedByDefault: false, maySatisfyEvidence: false });
    }
  });

  it('keeps high-risk teaching material in governed, non-evidentiary packs', () => {
    const packIds = [
      'research-instruments', 'architecture-model-patterns', 'competitive-research-methods',
      'persona-research-instruments', 'test-tooling', 'deployment-provider-examples', 'usability-instruments',
    ];
    for (const id of packIds) {
      const pack = readFileSync(resolve(process.cwd(), '..', '..', 'example-packs', `${id}.md`), 'utf8');
      expect(pack).toContain('illustrative: true');
      expect(pack).toContain('included_by_default: false');
      expect(pack).toContain('may_satisfy_evidence: false');
    }
  });
});

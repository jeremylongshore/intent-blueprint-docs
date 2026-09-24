export interface ExamplePackDefinition {
  id: string;
  illustrative: true;
  includedByDefault: false;
  maySatisfyEvidence: false;
}

const example = (id: string): ExamplePackDefinition => ({
  id,
  illustrative: true,
  includedByDefault: false,
  maySatisfyEvidence: false,
});

export const EXAMPLE_PACKS = [
  'adr-evaluation-methods',
  'task-breakdown-patterns',
  'agile-kanban-workflows',
  'research-instruments',
  'architecture-model-patterns',
  'competitive-research-methods',
  'persona-research-instruments',
  'journey-notation-patterns',
  'story-pattern-library',
  'acceptance-pattern-library',
  'ci-tooling-examples',
  'risk-scoring-methods',
  'facilitation-methods',
  'react-frontend',
  'test-tooling',
  'deployment-provider-examples',
  'cloud-kubernetes-operations',
  'dashboard-implementation-examples',
  'causal-analysis-methods',
  'usability-instruments',
].map(example) as readonly ExamplePackDefinition[];

export const EXAMPLE_PACK_BY_ID = new Map(EXAMPLE_PACKS.map(item => [item.id, item]));

export function getExamplePacksDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const paths = [
    join(here, '..', '..', 'example-packs'),
    join(here, '..', '..', '..', '..', 'example-packs'),
    join(process.cwd(), 'example-packs'),
  ];
  const found = paths.find(path => existsSync(path));
  if (!found) throw new Error('Example packs directory not found');
  return found;
}

export function loadExamplePack(id: string): string {
  if (!EXAMPLE_PACK_BY_ID.has(id)) throw new Error(`Unknown example pack: ${id}`);
  return readFileSync(join(getExamplePacksDir(), `${id}.md`), 'utf8');
}
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

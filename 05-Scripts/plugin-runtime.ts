/** Bundled with the portable skill; uses the same core as CLI and MCP. */
import { parseArgs } from 'node:util';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { generateAllDocuments, listTemplates, writeDocuments, type TemplateContext } from '../packages/cli/src/core/index.js';
import { generateEnterpriseDocuments } from '../packages/cli/src/core/enterprise.js';

try {
  const { values } = parseArgs({ options: {
    context: { type: 'string' }, output: { type: 'string' },
    'enterprise-intake': { type: 'string' }, project: { type: 'string' },
    list: { type: 'boolean' }, force: { type: 'boolean' },
  } });
  if (values.list) {
    console.log(JSON.stringify(listTemplates(), null, 2));
  } else if (values.context || values['enterprise-intake']) {
    if (values.context && values['enterprise-intake']) throw new Error('Choose context or enterprise intake, not both');
    if (values['enterprise-intake'] && !values.project) throw new Error('--project is required for enterprise intake');
    const docs = values['enterprise-intake']
      ? generateEnterpriseDocuments(values.project!, readFileSync(values['enterprise-intake'], 'utf8'))
      : generateAllDocuments(JSON.parse(readFileSync(values.context!, 'utf8')) as TemplateContext);
    const intake = values['enterprise-intake'] ? readFileSync(values['enterprise-intake'], 'utf8') : undefined;
    const intakeDestination = values.output && intake ? join(values.output, 'enterprise-intake.md') : undefined;
    if (intakeDestination && existsSync(intakeDestination) && !values.force && readFileSync(intakeDestination, 'utf8') !== intake) {
      throw new Error('Existing enterprise intake differs; use --force to replace it');
    }
    const files = values.output ? writeDocuments(docs, values.output, { overwrite: !!values.force }) : [];
    if (intakeDestination) {
      writeFileSync(intakeDestination, intake!);
      files.push(intakeDestination);
    }
    console.log(JSON.stringify(values.output ? { documents: docs.length, files } : { documents: docs }, null, 2));
  } else {
    console.log('Usage: node blueprint.mjs --list | --context context.json | --enterprise-intake intake.md --project name [--output directory] [--force]');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

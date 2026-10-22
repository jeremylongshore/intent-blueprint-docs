import { createHash } from 'node:crypto';
import { generateAllDocuments, type GeneratedDocument } from './index.js';

/** Preserve discovery as provided evidence; intake is never a verified control. */
export function generateEnterpriseDocuments(
  projectName: string, intake: string, sourceRef = 'enterprise-intake.md',
): GeneratedDocument[] {
  if (!intake.trim()) throw new Error('Enterprise intake is empty');
  const responses = [...intake.matchAll(/^###\s+\d+\.\s+([^\n]+)\n([\s\S]*?)(?=^###\s+\d+\.|^---\s*$|(?![\s\S]))/gm)]
    .map(match => ({ question: match[1].trim(), answer: match[2].trim() }))
    .filter(item => item.answer && item.answer !== '_(no answer)_');
  if (!responses.length) throw new Error('Enterprise intake has no answered discovery questions');
  return generateAllDocuments({
    projectName,
    projectDescription: `Enterprise documentation based on provided discovery: ${responses[0].answer}`,
    scope: 'comprehensive', audience: 'enterprise',
    sourceRefs: [sourceRef],
    sourceHashes: { [sourceRef]: `sha256:${createHash('sha256').update(intake).digest('hex')}` },
    evidence: responses.map((item, index) => ({
      id: `E-INTAKE-${index + 1}`, claim: `${item.question} ${item.answer}`,
      state: 'provided', sourceRefs: [sourceRef],
    })),
    unknowns: ['Discovery responses require validation by the accountable owners before approval.'],
  });
}

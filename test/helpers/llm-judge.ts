// Portions adapted from gstack (https://github.com/garrytan/gstack)
// Original: MIT License, Copyright (c) Garry Tan
//
// Copyright 2024 Intent Solutions
// Licensed under the Apache License, Version 2.0

/**
 * Shared LLM-as-judge helpers for documentation quality evaluation.
 *
 * Provides callJudge (generic JSON-from-LLM), judge (doc quality scorer),
 * and docSuiteJudge (multi-document consistency scorer).
 *
 * Requires: ANTHROPIC_API_KEY env var
 */

import Anthropic from '@anthropic-ai/sdk';

export interface JudgeScore {
  clarity: number;        // 1-5
  completeness: number;   // 1-5
  actionability: number;  // 1-5
  audience_fit: number;   // 1-5
  reasoning: string;
}

export interface DocSuiteJudgeResult {
  consistency: number;    // 1-5
  cross_references: number; // 1-5
  scope_alignment: number;  // 1-5
  terminology_uniformity: number; // 1-5
  reasoning: string;
}

/**
 * Call claude-sonnet-4-6 with a prompt, extract JSON response.
 * Retries once on 429 rate limit errors.
 */
export async function callJudge<T>(prompt: string): Promise<T> {
  const client = new Anthropic();

  const makeRequest = () => client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  let response;
  try {
    response = await makeRequest();
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 429) {
      await new Promise(r => setTimeout(r, 1000));
      response = await makeRequest();
    } else {
      throw err;
    }
  }

  const textBlock = response.content.find(
    (block): block is { type: 'text'; text: string } => block.type === 'text',
  );
  if (!textBlock) {
    throw new Error('Judge response did not include a text content block');
  }
  const text = textBlock.text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Judge returned non-JSON: ${text.slice(0, 200)}`);
  return JSON.parse(jsonMatch[0]) as T;
}

/**
 * Score a single document's quality on clarity/completeness/actionability/audience-fit (1-5).
 */
export async function judge(docName: string, content: string, audience: string = 'technical'): Promise<JudgeScore> {
  return callJudge<JudgeScore>(`You are evaluating documentation quality for a project documentation generator.

The documentation was generated from a professional template and should be:
1. Clear and well-structured
2. Complete with all sections filled in
3. Actionable with concrete next steps
4. Appropriate for the declared audience (${audience})

Rate the following document "${docName}" on four dimensions (1-5 scale):

- **clarity** (1-5): Is the document well-organized and easy to follow?
- **completeness** (1-5): Are all sections populated? Any placeholder text remaining?
- **actionability** (1-5): Can a reader take concrete action based on this document?
- **audience_fit** (1-5): Is the language and depth appropriate for a ${audience} audience?

Scoring guide:
- 5: Excellent — no issues, ready to use
- 4: Good — minor gaps easily addressed
- 3: Adequate — some rework needed
- 2: Poor — significant gaps
- 1: Unusable — fundamental problems

Respond with ONLY valid JSON:
{"clarity": N, "completeness": N, "actionability": N, "audience_fit": N, "reasoning": "brief explanation"}

Document content:

${content}`);
}

/**
 * Evaluate consistency across a documentation suite.
 */
export async function docSuiteJudge(
  docs: Array<{ name: string; content: string }>,
  scope: string = 'standard',
): Promise<DocSuiteJudgeResult> {
  const docSummaries = docs.map(d => `### ${d.name}\n${d.content.slice(0, 500)}...`).join('\n\n');

  return callJudge<DocSuiteJudgeResult>(`You are evaluating the consistency of a documentation suite.

This is a ${scope}-scope documentation suite with ${docs.length} documents.
Evaluate the suite's internal consistency.

Rate on four dimensions (1-5 scale):

- **consistency** (1-5): Is terminology consistent across documents?
- **cross_references** (1-5): Do documents reference each other appropriately?
- **scope_alignment** (1-5): Does the doc set match the declared ${scope} scope?
- **terminology_uniformity** (1-5): Are technical terms used identically everywhere?

Respond with ONLY valid JSON:
{"consistency": N, "cross_references": N, "scope_alignment": N, "terminology_uniformity": N, "reasoning": "brief explanation"}

Document summaries:

${docSummaries}`);
}

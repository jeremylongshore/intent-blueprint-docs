#!/usr/bin/env node
/**
 * Intent Blueprint MCP Server
 * Model-neutral adapter exposing Blueprint workbook tools over MCP.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  listTemplates,
  generateDocument,
  generateAllDocuments,
  writeDocuments,
  getTemplatesForScope,
  type TemplateContext,
} from '../core/index.js';
import {
  InterviewEngine,
  type InterviewAnswers,
} from '../interview/index.js';

const VERSION = '2.9.0';

// Tool schemas
const GenerateSchema = z.object({
  projectName: z.string().describe('Name of the project'),
  projectDescription: z.string().describe('Brief description of what the project does'),
  scope: z.enum(['mvp', 'standard', 'comprehensive']).default('standard'),
  audience: z.enum(['startup', 'business', 'enterprise']).default('business'),
  outputDir: z.string().optional(),
  writeFiles: z.boolean().default(false),
  projectType: z.string().optional(),
  techStack: z.array(z.string()).optional(),
});

const InterviewSchema = z.object({
  answers: z.record(z.unknown()).optional().describe('Answers provided so far'),
  action: z.enum(['start', 'answer', 'complete', 'analyze']).default('start'),
});

const ListTemplatesSchema = z.object({
  scope: z.enum(['mvp', 'standard', 'comprehensive']).optional(),
  category: z.string().optional(),
});

const CustomizeSchema = z.object({
  templateId: z.string(),
  projectName: z.string(),
  projectDescription: z.string().default(''),
  customFields: z.record(z.string()),
});

const TOOLS: Tool[] = [
  {
    name: 'blueprint_generate',
    description: 'Render model-neutral documentation workbooks. Returns a preview by default; set writeFiles=true for an explicit filesystem write.',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string', description: 'Name of the project' },
        projectDescription: { type: 'string', description: 'Brief description' },
        scope: { type: 'string', enum: ['mvp', 'standard', 'comprehensive'], default: 'standard' },
        audience: { type: 'string', enum: ['startup', 'business', 'enterprise'], default: 'business' },
        outputDir: { type: 'string', description: 'Output directory (optional)' },
        writeFiles: { type: 'boolean', default: false, description: 'Explicitly write rendered workbooks to disk' },
        projectType: { type: 'string' },
        techStack: { type: 'array', items: { type: 'string' } },
      },
      required: ['projectName', 'projectDescription'],
    },
  },
  {
    name: 'blueprint_interview',
    description: 'Start an interactive interview to gather project information.',
    inputSchema: {
      type: 'object',
      properties: {
        answers: { type: 'object', additionalProperties: true, description: 'Answers supplied so far' },
        action: { type: 'string', enum: ['start', 'answer', 'complete', 'analyze'], default: 'start' },
      },
    },
  },
  {
    name: 'blueprint_list_templates',
    description: 'List all available documentation templates.',
    inputSchema: {
      type: 'object',
      properties: {
        scope: { type: 'string', enum: ['mvp', 'standard', 'comprehensive'] },
        category: { type: 'string' },
      },
    },
  },
  {
    name: 'blueprint_customize',
    description: 'Generate a single customized document from a template.',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: { type: 'string' },
        projectName: { type: 'string' },
        projectDescription: { type: 'string', default: '' },
        customFields: { type: 'object', additionalProperties: { type: 'string' } },
      },
      required: ['templateId', 'projectName', 'customFields'],
    },
  },
];

const server = new Server(
  { name: 'intent-blueprint', version: VERSION },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
    case 'blueprint_generate': {
      const input = GenerateSchema.parse(args);
      const context: TemplateContext = {
        projectName: input.projectName,
        projectDescription: input.projectDescription,
        scope: input.scope,
        audience: input.audience,
        projectType: input.projectType,
        techStack: input.techStack,
      };

      const docs = generateAllDocuments(context);
      const outputDir = input.outputDir || `./docs/${input.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const files = input.writeFiles ? writeDocuments(docs, outputDir) : [];
      const preview = docs.slice(0, 3).map(doc => `## ${doc.name}\n\n${doc.content.slice(0, 900)}`).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `${input.writeFiles ? 'Wrote' : 'Rendered'} ${docs.length} workbooks for "${input.projectName}"${input.writeFiles ? `\n\nOutput: ${outputDir}\nFiles: ${files.length}` : '\n\nNo files were written. Set writeFiles=true to persist them.'}\n\nDocuments:\n${docs.map(d => `- ${d.name}`).join('\n')}\n\nPreview:\n\n${preview}`,
        }],
      };
    }

    case 'blueprint_interview': {
      const input = InterviewSchema.parse(args);
      const engine = new InterviewEngine();

      if (input.answers) {
        engine.setAnswers(input.answers as InterviewAnswers);
      }

      const state = engine.getState();

      if (input.action === 'analyze' || input.action === 'complete' || state.isComplete) {
        const result = engine.complete();
        return {
          content: [{
            type: 'text',
            text: `Interview Analysis Complete!

**Project:** ${result.answers.projectName || 'Untitled'}
**Type:** ${result.detected.projectType}
**Complexity:** ${result.detected.complexity}
**Suggested Scope:** ${result.detected.suggestedScope} (${result.detected.suggestedScope === 'mvp' ? 4 : result.detected.suggestedScope === 'standard' ? 12 : 22} docs)
**Confidence:** ${result.detected.confidence}%

**Technologies Detected:** ${result.detected.detectedTechnologies.join(', ') || 'None specified'}
**Features Detected:** ${result.detected.detectedFeatures.join(', ') || 'None detected'}

${result.gaps.suggestions.length > 0 ? `**Suggestions:**\n${result.gaps.suggestions.map(s => `- ${s}`).join('\n')}` : ''}

Use \`blueprint_generate\` with these values to create documentation.`,
          }],
        };
      }

      const nextQ = state.currentQuestion;
      const progress = state.progress;

      if (!nextQ) {
        return {
          content: [{
            type: 'text',
            text: 'Interview complete! Use action: "complete" to see analysis.',
          }],
        };
      }

      return {
        content: [{
          type: 'text',
          text: `**Question ${progress.answered + 1}/${progress.total}** (${progress.percentage}% complete)
${nextQ.required ? '*(required)*' : '*(optional)*'}

${nextQ.text}
${nextQ.hint ? `\n*Hint: ${nextQ.hint}*` : ''}
${nextQ.options ? `\n**Options:** ${nextQ.options.join(', ')}` : ''}

To answer, call blueprint_interview with:
\`{ "answers": { "${nextQ.id}": "your answer", ...previous_answers }, "action": "answer" }\``,
        }],
      };
    }

    case 'blueprint_list_templates': {
      const input = ListTemplatesSchema.parse(args);
      let templates = input.scope ? getTemplatesForScope(input.scope) : listTemplates();
      if (input.category) {
        templates = templates.filter(t => t.category.toLowerCase().includes(input.category!.toLowerCase()));
      }

      const grouped = templates.reduce((acc, t) => {
        if (!acc[t.category]) acc[t.category] = [];
        acc[t.category].push(t);
        return acc;
      }, {} as Record<string, typeof templates>);

      return {
        content: [{
          type: 'text',
          text: `Available Templates:\n\n${Object.entries(grouped).map(([cat, temps]) =>
            `${cat}:\n${temps.map(t => `  - ${t.name} (${t.id})`).join('\n')}`
          ).join('\n\n')}`,
        }],
      };
    }

    case 'blueprint_customize': {
      const input = CustomizeSchema.parse(args);
      const context: TemplateContext = {
        projectName: input.projectName,
        projectDescription: input.projectDescription,
        scope: 'comprehensive',
        audience: 'business',
        ...input.customFields,
      };

      const doc = generateDocument(input.templateId, context);
      return {
        content: [{ type: 'text', text: `Generated: ${doc.name}\n\n---\n\n${doc.content}` }],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues.map(issue => `${issue.path.join('.') || 'input'}: ${issue.message}`).join('; ')
      : error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: 'text', text: `Blueprint request failed: ${message}` }],
    };
  }
});

export async function startMcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Intent Blueprint MCP Server running...');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startMcpServer().catch(console.error);
}

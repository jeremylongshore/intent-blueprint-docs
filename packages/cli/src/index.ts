/**
 * Intent Blueprint
 * Enterprise documentation generator - CLI, MCP Server, and programmatic API
 *
 * @packageDocumentation
 */

export { VERSION } from './version.js';

// Core exports for programmatic use
export {
  listTemplates,
  generateDocument,
  generateAllDocuments,
  writeDocuments,
  getTemplatesForScope,
  compileTemplate,
  getTemplatesDir,
  Handlebars,
  SCOPES,
  AUDIENCES,
  type TemplateContext,
  type GeneratedDocument,
  type TemplateInfo,
} from './core/index.js';

export {
  EVIDENCE_STATES,
  RECORD_PREFIXES,
  LIFECYCLE_EDGE_RULES,
  RecordIdSchema,
  EvidenceItemSchema,
  HumanReviewSchema,
  DocumentMetadataSchema,
  TemplateSectionSchema,
  TemplateDefinitionSchema,
  TraceNodeSchema,
  TraceEdgeSchema,
  TraceGraphSchema,
  GenerationReceiptSchema,
  type EvidenceState,
  type EvidenceItem,
  type DocumentMetadata,
  type TemplateDefinition,
  type TraceNode,
  type TraceEdge,
  type TraceGraph,
  type GenerationReceiptV1,
} from './core/schema.js';

export {
  TEMPLATE_DEFINITIONS,
  TEMPLATE_BY_ID,
  LEGACY_TEMPLATE_MIGRATIONS,
  validateTemplateCatalog,
} from './core/catalog.js';

export { BLUEPRINT_MODULES, BLUEPRINT_MODULE_BY_ID, type BlueprintModule } from './core/modules.js';
export { EXAMPLE_PACKS, EXAMPLE_PACK_BY_ID, type ExamplePackDefinition } from './core/examples.js';
export { renderSchemaBlueprint, type SchemaRenderContext, type RenderedBlueprint } from './core/renderer.js';

// Interview engine exports
export {
  InterviewEngine,
  quickInterview,
  detectContext,
  analyzeGaps,
  analyzeDescription,
  calculateComplexity,
  generateSummary,
  QUESTION_GROUPS,
  getActiveQuestions,
  getNextQuestion,
  getProgress,
  type InterviewState,
  type InterviewAnswers,
  type InterviewResult,
  type Question,
  type DetectedContext,
  type GapAnalysis,
  type ProjectType,
  type Complexity,
  type Audience,
  type Scope,
  type QuestionGroup,
} from './interview/index.js';

// MCP server export
export { createMcpServer, startMcpServer } from './mcp/index.js';

// GitHub integration exports
export {
  GitHubClient,
  GitHubExporter,
  exportToGitHub,
  generateDocGenAction,
  generatePRSyncAction,
  generateAllActions,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STANDARD_LABELS,
  type GitHubConfig,
  type GitHubLabel,
  type GitHubMilestone,
  type GitHubIssue,
  type GitHubPRTemplate,
  type TaskBreakdown,
  type ReleasePhase,
  type ExportResult,
  type ExportOptions,
  type ActionConfig,
} from './integrations/github/index.js';

// Linear integration exports
export {
  LinearClient,
  LinearExporter,
  exportToLinear,
  PRIORITY_MAP,
  STANDARD_LABELS as LINEAR_STANDARD_LABELS,
  CATEGORY_LABELS as LINEAR_CATEGORY_LABELS,
  type LinearConfig,
  type LinearTeam,
  type LinearProject,
  type LinearCycle,
  type LinearLabel,
  type LinearIssue,
  type LinearWorkflowState,
  type CreateIssueInput,
  type CreateProjectInput,
  type CreateCycleInput,
  type LinearTaskBreakdown,
  type LinearTaskItem,
  type LinearExportResult,
  type LinearExportOptions,
} from './integrations/linear/index.js';

// Jira integration exports
export {
  JiraClient,
  JiraExporter,
  exportToJira,
  PRIORITY_MAP as JIRA_PRIORITY_MAP,
  STANDARD_LABELS as JIRA_STANDARD_LABELS,
  CATEGORY_COMPONENTS,
  type JiraConfig,
  type JiraProject,
  type JiraIssueType,
  type JiraPriority,
  type JiraStatus,
  type JiraUser,
  type JiraSprint,
  type JiraBoard,
  type JiraComponent,
  type JiraVersion,
  type JiraIssue,
  type CreateIssueInput as JiraCreateIssueInput,
  type CreateSprintInput,
  type CreateVersionInput,
  type JiraTaskBreakdown,
  type JiraStoryItem,
  type JiraTaskItem,
  type JiraExportResult,
  type JiraExportOptions,
} from './integrations/jira/index.js';

// Notion integration exports
export {
  NotionClient,
  NotionExporter,
  exportToNotion,
  CATEGORY_ICONS,
  STATUS_OPTIONS,
  CATEGORY_OPTIONS,
  type NotionConfig,
  type NotionUser,
  type NotionPage,
  type NotionDatabase,
  type NotionParent,
  type NotionRichText,
  type NotionProperty,
  type NotionPropertySchema,
  type NotionBlock,
  type NotionParagraphBlock,
  type NotionHeadingBlock,
  type NotionBulletedListBlock,
  type NotionNumberedListBlock,
  type NotionToDoBlock,
  type NotionCodeBlock,
  type NotionQuoteBlock,
  type NotionCalloutBlock,
  type NotionDividerBlock,
  type CreatePageInput as NotionCreatePageInput,
  type CreateDatabaseInput as NotionCreateDatabaseInput,
  type NotionDocumentPage,
  type NotionExportResult,
  type NotionExportOptions,
} from './integrations/notion/index.js';

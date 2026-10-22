/**
 * Interview Engine Module
 * Adaptive questioning system for documentation generation
 */

export {
  InterviewEngine,
  quickInterview,
  type InterviewState,
  type InterviewAnswers,
  type InterviewResult,
  type Question,
  type DetectedContext,
  type GapAnalysis,
} from './engine.js';

export { runAdaptiveInterview } from './runner.js';

export {
  QUESTION_GROUPS,
  getActiveQuestions,
  getNextQuestion,
  getProgress,
} from './questions.js';

export {
  detectContext,
  analyzeGaps,
  analyzeDescription,
  calculateComplexity,
  generateSummary,
} from './analyzer.js';

export type {
  ProjectType,
  Complexity,
  Audience,
  Scope,
  QuestionGroup,
} from './types.js';

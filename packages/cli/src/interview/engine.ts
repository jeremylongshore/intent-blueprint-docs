/**
 * Interview Engine
 * Orchestrates the adaptive interview process
 */

import type {
  InterviewAnswers,
  InterviewResult,
  Question,
  DetectedContext,
  GapAnalysis,
} from './types.js';
import { QUESTION_GROUPS, getActiveQuestions, getNextQuestion, getProgress } from './questions.js';
import { detectContext, analyzeGaps, generateSummary } from './analyzer.js';
import type { TemplateContext } from '../core/index.js';

export interface InterviewState {
  answers: InterviewAnswers;
  currentQuestion: Question | null;
  progress: { answered: number; total: number; percentage: number };
  isComplete: boolean;
  detected: DetectedContext | null;
}

export class InterviewEngine {
  private answers: InterviewAnswers = {};
  private onProgress?: (state: InterviewState) => void;

  constructor(options?: { onProgress?: (state: InterviewState) => void }) {
    this.onProgress = options?.onProgress;
  }

  /**
   * Get current interview state
   */
  getState(): InterviewState {
    const currentQuestion = getNextQuestion(this.answers);
    const progress = getProgress(this.answers);
    const isComplete = currentQuestion === null;
    const detected = isComplete ? detectContext(this.answers) : null;

    return {
      answers: { ...this.answers },
      currentQuestion,
      progress,
      isComplete,
      detected,
    };
  }

  /**
   * Answer a question
   */
  answer(questionId: string, value: unknown): InterviewState {
    const questions = getActiveQuestions(this.answers);
    const question = questions.find((q) => q.id === questionId);

    if (!question) {
      throw new Error(`Question not found: ${questionId}`);
    }

    // Validate
    if (question.validate) {
      const validationResult = question.validate(value, this.answers);
      if (validationResult !== true) {
        throw new Error(typeof validationResult === 'string' ? validationResult : 'Invalid answer');
      }
    }

    // Transform
    const transformedValue = question.transform ? question.transform(value) : value;

    // Store
    this.answers[questionId] = transformedValue;

    const state = this.getState();
    this.onProgress?.(state);

    return state;
  }

  /**
   * Set multiple answers at once
   */
  setAnswers(answers: Partial<InterviewAnswers>): InterviewState {
    for (const [key, value] of Object.entries(answers)) {
      if (value !== undefined) {
        this.answers[key] = value;
      }
    }

    const state = this.getState();
    this.onProgress?.(state);

    return state;
  }

  /**
   * Reset the interview
   */
  reset(): void {
    this.answers = {};
  }

  /**
   * Get all question groups with their active questions
   */
  getQuestionGroups(): Array<{
    id: string;
    name: string;
    description: string;
    questions: Question[];
    isActive: boolean;
  }> {
    return QUESTION_GROUPS.map((group) => {
      const isActive = !group.condition || group.condition(this.answers);
      const questions = isActive
        ? group.questions.filter((q) => !q.condition || q.condition(this.answers))
        : [];

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        questions,
        isActive,
      };
    });
  }

  /**
   * Complete the interview and get results
   */
  complete(): InterviewResult {
    const detected = detectContext(this.answers);
    const gaps = analyzeGaps(this.answers);
    const summary = generateSummary(this.answers, detected);

    // Build template context
    const templateContext = this.buildTemplateContext(detected, gaps);

    return {
      answers: { ...this.answers },
      detected,
      gaps,
      templateContext,
      summary,
    };
  }

  /**
   * Build template context from answers and detected info
   */
  private buildTemplateContext(
    detected: DetectedContext,
    gaps: GapAnalysis
  ): Record<string, unknown> {
    const answers = this.answers;

    // Apply assumptions for missing fields
    const effectiveAnswers = { ...answers };
    for (const assumption of gaps.assumptions) {
      if (effectiveAnswers[assumption.field] === undefined) {
        // Only apply high-confidence assumptions
        if (assumption.confidence >= 70) {
          effectiveAnswers[assumption.field] = true;
        }
      }
    }

    return {
      // Core
      projectName: answers.projectName || 'Untitled Project',
      projectDescription: answers.projectDescription || '',
      projectType: answers.projectType || detected.projectType,

      // Scope and audience
      scope: answers.scope || detected.suggestedScope,
      audience: answers.audience || detected.suggestedAudience,

      // Technical
      techStack: detected.detectedTechnologies,
      hasFrontend: effectiveAnswers.hasFrontend ?? true,
      hasBackend: effectiveAnswers.hasBackend ?? true,
      hasDatabase: effectiveAnswers.hasDatabase ?? true,
      hasAuth: effectiveAnswers.hasAuth ?? false,
      hasPayments: effectiveAnswers.hasPayments ?? false,
      deploymentTarget: answers.deploymentTarget || 'Cloud (AWS/GCP/Azure)',

      // Business
      teamSize: answers.teamSize || 'Small (2-5)',
      timeline: answers.timeline || 'TBD',
      monetization: answers.monetization || 'Not specified',
      competitors: answers.competitorNames || [],

      // Features
      features: detected.detectedFeatures,
      priorityFeatures: answers.priorityFeatures || [],
      mvpFeatures: answers.mvpFeatures || [],

      // Compliance
      needsCompliance: answers.needsCompliance ?? false,
      complianceTypes: answers.complianceTypes || [],

      // Metadata
      complexity: detected.complexity,
      generatedAt: new Date().toISOString(),
      confidence: detected.confidence,

      // For template conditionals
      isEnterprise: answers.audience === 'enterprise',
      isStartup: answers.audience === 'startup',
      isSaaS: answers.projectType === 'saas-web',
      isMobile: answers.projectType === 'mobile-app',
      isAPI: answers.projectType === 'api-backend',
      hasCompetitors: (answers.competitorNames?.length || 0) > 0,
    };
  }

  /**
   * Convert to TemplateContext for document generation
   */
  toTemplateContext(): TemplateContext {
    const result = this.complete();
    return {
      projectName: result.templateContext.projectName as string,
      projectDescription: result.templateContext.projectDescription as string,
      scope: result.templateContext.scope as 'mvp' | 'standard' | 'comprehensive',
      audience: result.templateContext.audience as 'startup' | 'business' | 'enterprise',
      projectType: result.templateContext.projectType as string,
      techStack: result.templateContext.techStack as string[],
      features: result.templateContext.features as string[],
      timeline: result.templateContext.timeline as string,
      team: result.templateContext.teamSize as string,
      evidence: Object.entries(result.answers).map(([key, value], index) => ({
        id: `E-INTERVIEW-${index + 1}`, claim: `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`,
        state: 'provided' as const, sourceRefs: [],
      })),
      assumptions: result.gaps.assumptions.map(item => `${item.field}: ${item.assumption} (heuristic confidence ${item.confidence}%)`),
      unknowns: result.gaps.missingRecommended,
    };
  }
}

/**
 * Quick interview - just the essentials
 */
export function quickInterview(
  projectName: string,
  projectDescription: string,
  options?: {
    scope?: 'mvp' | 'standard' | 'comprehensive';
    audience?: 'startup' | 'business' | 'enterprise';
  }
): InterviewResult {
  const engine = new InterviewEngine();

  engine.setAnswers({
    projectName,
    projectDescription,
    scope: options?.scope,
    audience: options?.audience,
  });

  return engine.complete();
}

// Re-export types
export type { InterviewAnswers, InterviewResult, Question, DetectedContext, GapAnalysis };

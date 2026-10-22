import { InterviewEngine } from './engine.js';
import type { Question } from './types.js';

/** Recompute conditions after every answer, including newly activated groups. */
export async function runAdaptiveInterview(
  engine: InterviewEngine,
  ask: (question: Question) => Promise<unknown>,
): Promise<void> {
  for (let question = engine.getState().currentQuestion; question; question = engine.getState().currentQuestion) {
    engine.answer(question.id, await ask(question));
  }
}

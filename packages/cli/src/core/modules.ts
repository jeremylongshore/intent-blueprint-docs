export interface BlueprintModule {
  id: string;
  purpose: string;
  requiredFields: readonly string[];
}

const module = (id: string, purpose: string, requiredFields: string[]): BlueprintModule => ({
  id,
  purpose,
  requiredFields,
});

export const BLUEPRINT_MODULES = [
  module('evidence-register', 'Keep every material claim tied to an evidence state and source.', ['claim', 'state', 'source or next action', 'owner']),
  module('traceability', 'Connect objectives, requirements, decisions, delivery, tests, and outcomes.', ['from ID', 'relationship', 'to ID', 'rationale']),
  module('requirements', 'Define stable, testable requirements without assuming an implementation.', ['requirement ID', 'statement', 'evidence state', 'verification']),
  module('research-evidence', 'Separate the research plan, raw evidence, findings, and limitations.', ['question', 'method', 'source', 'confidence', 'limitation']),
  module('risk-controls', 'Record exposure, treatment, residual risk, and accountable acceptance.', ['risk ID', 'cause', 'consequence', 'control', 'owner']),
  module('control-evidence', 'Define a safeguard and the evidence needed to prove it operates.', ['control ID', 'objective', 'implementation state', 'test evidence']),
  module('governance', 'Make review, approval, waiver, and supersession decisions auditable.', ['decision', 'authority', 'state', 'evidence', 'date']),
  module('operations', 'Define ownership, observability, recovery, and incident readiness.', ['service', 'owner', 'signal', 'response', 'recovery evidence']),
  module('metrics', 'Define measures with formulas, lineage, interpretation, and ownership.', ['metric ID', 'question', 'formula', 'source', 'owner']),
  module('actions', 'Track accountable work and objective closure evidence.', ['action ID', 'owner', 'state', 'due condition', 'closure evidence']),
  module('safety-applicability', 'Decide and justify security, privacy, accessibility, and resilience applicability.', ['area', 'applicability', 'rationale', 'owner', 'evidence']),
] as const satisfies readonly BlueprintModule[];

export const BLUEPRINT_MODULE_BY_ID = new Map(BLUEPRINT_MODULES.map(item => [item.id, item]));

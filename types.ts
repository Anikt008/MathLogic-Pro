export interface ParsedProblem {
  id: string;
  given: string[];
  to_prove: string;
  variables: string[];
  domain_constraints: string[];
  problem_tags: string[];
  difficulty_estimate: string;
  suggested_lemmas: string[];
}

export interface LogicStep {
  step_no: number;
  statement: string;
  justification: string;
  checkable_assertions: string[];
  confidence: string;
}

export interface MachineReadableJson {
  proof_id: string;
  steps: LogicStep[];
  final_answer: string;
  machine_checks: string[];
}

export interface MathResponse {
  human_readable_proof: string;
  machine_readable_json: MachineReadableJson;
  python_verification: string;
  certainty: 'CERTAIN' | 'UNSURE';
  uncertainty_reason?: string;
  parsed_problem?: ParsedProblem;
}

export enum TabOption {
  PROOF = 'PROOF',
  JSON = 'JSON',
  PYTHON = 'PYTHON'
}

export interface Message {
  role: 'user' | 'assistant';
  content: string | MathResponse;
  timestamp: number;
}

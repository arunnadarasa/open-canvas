/**
 * Conditional Choreography DSL parser/validator.
 *
 * Grammar:
 *   <action>:<move_name> if <variable> <operator> <threshold>
 *   <action>:<move_name> otherwise
 *
 * Variables: sentiment, proximity, tempo, energy, volume
 * Operators: >, <, >=, <=, ==
 */

export interface DSLCondition {
  action: string;
  moveName: string;
  variable?: string;
  operator?: string;
  threshold?: number;
  otherwise?: boolean;
}

const VALID_VARIABLES = ['sentiment', 'proximity', 'tempo', 'energy', 'volume'];
const VALID_OPERATORS = ['>', '<', '>=', '<=', '=='];

const CONDITION_RE = /^(\w+):(\w+)\s+if\s+(\w+)\s*(>=|<=|==|>|<)\s*([\d.]+)$/;
const OTHERWISE_RE = /^(\w+):(\w+)\s+otherwise$/;

/**
 * Check if a string looks like DSL (has at least one conditional or "otherwise" line).
 */
export function isDSL(text: string): boolean {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return false;
  return lines.some(l => CONDITION_RE.test(l) || OTHERWISE_RE.test(l));
}

/**
 * Parse DSL text into structured conditions. Returns null if invalid.
 */
export function parseDSL(text: string): DSLCondition[] | null {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const conditions: DSLCondition[] = [];
  for (const line of lines) {
    const condMatch = line.match(CONDITION_RE);
    if (condMatch) {
      const [, action, moveName, variable, operator, threshold] = condMatch;
      if (!VALID_VARIABLES.includes(variable)) return null;
      if (!VALID_OPERATORS.includes(operator)) return null;
      conditions.push({ action, moveName, variable, operator, threshold: parseFloat(threshold) });
      continue;
    }
    const otherMatch = line.match(OTHERWISE_RE);
    if (otherMatch) {
      const [, action, moveName] = otherMatch;
      conditions.push({ action, moveName, otherwise: true });
      continue;
    }
    // Line doesn't match any pattern — not valid DSL
    return null;
  }
  return conditions.length > 0 ? conditions : null;
}

/**
 * Validate DSL text. Returns error message or null if valid.
 */
export function validateDSL(text: string): string | null {
  if (!isDSL(text)) return null; // not DSL, that's fine (plain text)
  const result = parseDSL(text);
  if (!result) {
    return 'Invalid DSL syntax. Use: action:move_name if variable operator threshold';
  }
  const otherwiseCount = result.filter(c => c.otherwise).length;
  if (otherwiseCount > 1) return 'Only one "otherwise" clause allowed.';
  if (otherwiseCount === 1 && !result[result.length - 1].otherwise) {
    return '"otherwise" must be the last clause.';
  }
  return null;
}

/** DSL syntax hint text */
export const DSL_HINT = `Supports conditional choreography DSL:
  dance:chest_pop if sentiment > 0.8
  dance:wave if proximity < 2.0
  dance:idle otherwise

Variables: ${VALID_VARIABLES.join(', ')}
Operators: ${VALID_OPERATORS.join(', ')}
Also accepts plain IPFS CIDs or text descriptions.`;

/**
 * @impactalign/ai — provider abstraction (interfaces only in Phase 1).
 *
 * Non-negotiable rules encoded here so later phases cannot forget them:
 *  - AI output is always labelled as AI-generated.
 *  - AI never makes the final validation or accreditation decision; a human assessor does.
 */
export const AI_GENERATED_LABEL = 'AI-generated recommendation — requires human review' as const;

export interface AiCompletionRequest {
  readonly prompt: string;
  readonly maxOutputTokens?: number;
}

export interface AiRecommendation {
  readonly text: string;
  readonly generatedByAi: true;
  readonly label: typeof AI_GENERATED_LABEL;
  readonly provider: string;
  readonly model: string;
}

/** Implemented per vendor behind this interface so providers stay swappable. */
export interface AiProvider {
  readonly name: string;
  complete(request: AiCompletionRequest): Promise<AiRecommendation>;
  embed(texts: readonly string[]): Promise<number[][]>;
}

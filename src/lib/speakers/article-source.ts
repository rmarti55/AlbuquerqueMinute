/**
 * Phase 3 article generation must consume the resolved transcript.
 * Do not fall back to raw Speaker-N text for names.
 */
export function getArticleTranscript(input: {
  resolvedTranscript?: string | null;
  rawTranscript?: string | null;
}): string {
  const resolved = input.resolvedTranscript?.trim();
  if (resolved) return resolved;
  throw new Error(
    'Resolved transcript is required for article generation. Run speaker resolution first. ' +
      'Names in resolved speaker metadata are authoritative — do not derive names from dialogue.',
  );
}

export const ARTICLE_NAME_RULE =
  'Names in the resolved speaker metadata are authoritative. Do not derive, expand, correct, or infer a person\'s name from transcript dialogue.';

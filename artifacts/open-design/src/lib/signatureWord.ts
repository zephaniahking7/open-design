const FILLERS = new Set([
  'the', 'a', 'an', 'and', 'to', 'for', 'with', 'into', 'of', 'from',
  'on', 'in', 'by', 'at', 'as', 'is', 'was', 'will', 'be', 'that',
  'this', 'it', 'they', 'we', 'you', 'your', 'our',
]);

export type SignatureSplit = {
  before: string;
  word: string;
  after: string;
};

const TRAILING_PUNCT = /[.,;:!?…)"'\]]+$/;
const LEADING_PUNCT = /^["'(\[]+/;

function normalise(token: string): string {
  return token
    .replace(LEADING_PUNCT, '')
    .replace(TRAILING_PUNCT, '')
    .toLowerCase();
}

export function pickSignatureWord(sentence: string): SignatureSplit | null {
  if (!sentence) return null;

  const tokens = sentence.match(/\S+/g);
  if (!tokens || tokens.length === 0) return null;

  // Walk right-to-left for the strongest final non-filler word.
  // Fallback (also right-to-left) is just the last non-filler regardless;
  // since we already iterate from the end and accept the first hit, the
  // primary pass and fallback collapse into one walk.
  let chosenIndex = -1;
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const norm = normalise(tokens[i]);
    if (norm.length === 0) continue;
    if (!FILLERS.has(norm)) {
      chosenIndex = i;
      break;
    }
  }
  if (chosenIndex === -1) return null;

  // Reconstruct the original string preserving exact whitespace by
  // splitting on the chosen token's index in the original sentence.
  // We can't rely on token positions from the regex iterator, so we
  // scan the source and rebuild boundaries manually.
  let cursor = 0;
  const positions: { start: number; end: number }[] = [];
  for (const tok of tokens) {
    const start = sentence.indexOf(tok, cursor);
    const end = start + tok.length;
    positions.push({ start, end });
    cursor = end;
  }
  const { start, end } = positions[chosenIndex];
  return {
    before: sentence.slice(0, start),
    word: sentence.slice(start, end),
    after: sentence.slice(end),
  };
}

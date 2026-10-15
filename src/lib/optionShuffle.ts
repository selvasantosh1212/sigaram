// Options that point at other options or at labelled statements by position — shuffling
// these would break the question ("All of the above" no longer last, "(a) and (c)"
// pointing at the wrong pair, Assertion-Reason codes out of their conventional order).
const POSITION_DEPENDENT =
  /\b(all|none) of (the )?(above|these|them)\b|^all the above$|\[A\]|\[R\]|\bassertion\b|\((?:[a-d]|[ivx]+|\d)\)|^\d+(?:,? (?:and )?\d+)*(?: only)?$|^[A-D](?: and [A-D])?$|^both [IVX]+ and [IVX]+$|^neither$/i;

export function isPositionDependent(options: string[], prompt = ""): boolean {
  if (options.some((o) => POSITION_DEPENDENT.test(o.trim()))) return true;
  // Spot-the-error style: the options are the prompt's own sentence segments, in order.
  const p = prompt.toLowerCase();
  return p.length > 0 && options.every((o) => o.trim().length > 0 && p.includes(o.trim().toLowerCase()));
}

// Fisher–Yates over option indices; returns the options in their new order plus the
// remapped correct index. Position-dependent questions come back unchanged.
export function shuffleOptions(
  options: string[],
  correctIndex: number,
  random: () => number = Math.random,
  prompt = ""
): { options: string[]; correctIndex: number } {
  if (isPositionDependent(options, prompt)) return { options, correctIndex };
  const order = options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { options: order.map((i) => options[i]), correctIndex: order.indexOf(correctIndex) };
}

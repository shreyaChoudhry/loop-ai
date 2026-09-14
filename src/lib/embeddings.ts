const EMBEDDING_DIMENSIONS = 128;

export function createEmbedding(
  text: string
): number[] {
  const vector = new Array<number>(
    EMBEDDING_DIMENSIONS
  ).fill(0);

  const normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return vector;
  }

  const words = normalized.split(" ");

  for (const word of words) {
    if (!word) continue;

    let hash = 0;

    for (let i = 0; i < word.length; i++) {
      hash =
        (hash * 31 +
          word.charCodeAt(i)) >>>
        0;
    }

    const index =
      hash % EMBEDDING_DIMENSIONS;

    vector[index] += 1;

    const lengthIndex =
      (hash + word.length * 17) %
      EMBEDDING_DIMENSIONS;

    vector[lengthIndex] += 0.5;
  }

  for (
    let i = 0;
    i < normalized.length - 2;
    i++
  ) {
    const gram =
      normalized.slice(i, i + 3);

    let hash = 0;

    for (let j = 0; j < gram.length; j++) {
      hash =
        (hash * 31 +
          gram.charCodeAt(j)) >>>
        0;
    }

    const index =
      hash % EMBEDDING_DIMENSIONS;

    vector[index] += 0.25;
  }

  const magnitude = Math.sqrt(
    vector.reduce(
      (sum, value) =>
        sum + value * value,
      0
    )
  );

  if (magnitude === 0) {
    return vector;
  }

  return vector.map(
    (value) => value / magnitude
  );
}

export function cosineSimilarity(
  a: number[],
  b: number[]
): number {
  if (
    a.length !== b.length ||
    a.length === 0
  ) {
    return 0;
  }

  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  if (
    magnitudeA === 0 ||
    magnitudeB === 0
  ) {
    return 0;
  }

  return (
    dot /
    (Math.sqrt(magnitudeA) *
      Math.sqrt(magnitudeB))
  );
}
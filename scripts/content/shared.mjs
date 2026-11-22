export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']

export const DIFFICULTY = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
}

export function hashString(input) {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function makeRng(seed) {
  let state = typeof seed === 'string' ? hashString(seed) : seed >>> 0
  return function rng() {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle(items, rng) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1))
    ;[copy[index], copy[swap]] = [copy[swap], copy[index]]
  }
  return copy
}

export function unique(items) {
  return [...new Set(items.filter((item) => typeof item === 'string' && item.trim().length > 0))]
}

export function pickDistractors(correct, pool, count, rng, excluded = []) {
  const blocked = new Set([correct, ...excluded])
  const candidates = unique(pool).filter((item) => !blocked.has(item))
  const shuffled = shuffle(candidates, rng)
  return shuffled.slice(0, count)
}

export function buildOptions(correct, distractors, rng) {
  const options = unique([correct, ...distractors]).slice(0, 4)
  while (options.length < 4) {
    options.push(`option-${options.length + 1}`)
  }
  const shuffled = shuffle(options, rng)
  return {
    options: shuffled,
    answer: shuffled.indexOf(correct),
  }
}

export function makeQuestion({
  id,
  section,
  type,
  level,
  topic,
  tags,
  stem,
  correct,
  distractors,
  explanation,
  source = 'original',
  sourceNote,
  script,
  setId,
  passageId,
}) {
  const rng = makeRng(`${id}:${stem}`)
  const { options, answer } = buildOptions(correct, distractors, rng)
  return {
    id,
    section,
    type,
    level,
    difficulty: DIFFICULTY[level],
    topic,
    tags: unique(tags),
    stem,
    options,
    answer,
    explanation,
    ...(script ? { script } : {}),
    ...(setId ? { setId } : {}),
    ...(passageId ? { passageId } : {}),
    source,
    ...(sourceNote ? { sourceNote } : {}),
  }
}

export function pad(value, width = 3) {
  return String(value).padStart(width, '0')
}

export function slug(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function sourceFor(index) {
  if (index > 0 && index % 10 === 0) {
    return {
      source: 'adapted-public',
      sourceNote: '题目结构参考公开商务英语样题，内容与选项均重新编写。',
    }
  }
  return { source: 'original' }
}

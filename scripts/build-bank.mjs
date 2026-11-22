import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildVocabulary } from './content/vocabulary.mjs'
import { buildGrammar } from './content/grammar.mjs'
import { buildListening } from './content/listening.mjs'
import { buildReading } from './content/reading.mjs'
import { LEVELS, unique } from './content/shared.mjs'

const outputDir = join(process.cwd(), 'public', 'data')
mkdirSync(outputDir, { recursive: true })

const vocabulary = buildVocabulary()
const grammar = buildGrammar()
const listening = buildListening()
const reading = buildReading()

const questions = {
  listening: listening.questions,
  vocabulary,
  grammar,
  reading: reading.questions,
}

const counts = Object.fromEntries(
  Object.entries(questions).map(([section, list]) => [section, list.length]),
)

const levels = Object.fromEntries(
  Object.entries(questions).map(([section, list]) => [
    section,
    Object.fromEntries(LEVELS.map((level) => [level, list.filter((question) => question.level === level).length])),
  ]),
)

const allQuestions = Object.values(questions).flat()
const topics = unique(allQuestions.map((question) => question.topic)).sort()
const tags = unique(allQuestions.flatMap((question) => question.tags)).sort()
const total = allQuestions.length

const manifest = {
  version: '1.0.0',
  builtAt: new Date().toISOString().slice(0, 10),
  total,
  counts,
  levels,
  topics,
  tags,
}

function writeJSON(name, data) {
  const path = join(outputDir, name)
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  console.log(`wrote ${path}`)
}

writeJSON('manifest.json', manifest)
writeJSON('vocabulary.json', { questions: vocabulary })
writeJSON('grammar.json', { questions: grammar })
writeJSON('listening.json', { sets: listening.sets, questions: listening.questions })
writeJSON('reading.json', { passages: reading.passages, questions: reading.questions })

console.log('')
console.log(`Built ${total} questions`)
for (const section of Object.keys(counts)) {
  console.log(`  ${section.padEnd(12)} ${counts[section]}`)
}
console.log(`  listening sets ${listening.sets.length}`)
console.log(`  reading passages ${reading.passages.length}`)

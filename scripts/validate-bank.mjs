import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const dataDir = join(process.cwd(), 'public', 'data')
const levels = ['A1', 'A2', 'B1', 'B2', 'C1']
const difficultyByLevel = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5 }
const sections = ['listening', 'vocabulary', 'grammar', 'reading']

function read(name) {
  return JSON.parse(readFileSync(join(dataDir, name), 'utf8'))
}

const manifest = read('manifest.json')
const vocabulary = read('vocabulary.json')
const grammar = read('grammar.json')
const listening = read('listening.json')
const reading = read('reading.json')

const errors = []
const fail = (message) => errors.push(message)

function validateQuestion(question, expectedSection) {
  const label = `${expectedSection}/${question?.id ?? 'unknown'}`
  if (!question || typeof question !== 'object') {
    fail(`${label}: question is not an object`)
    return
  }
  if (typeof question.id !== 'string' || !question.id) fail(`${label}: missing id`)
  if (question.section !== expectedSection) fail(`${label}: section is ${question.section}`)
  if (!levels.includes(question.level)) fail(`${label}: invalid level ${question.level}`)
  if (question.difficulty !== difficultyByLevel[question.level]) {
    fail(`${label}: difficulty ${question.difficulty} does not match level ${question.level}`)
  }
  if (typeof question.topic !== 'string' || !question.topic) fail(`${label}: missing topic`)
  if (!Array.isArray(question.tags) || question.tags.length === 0) fail(`${label}: missing tags`)
  if (typeof question.stem !== 'string' || question.stem.trim().length < 5) fail(`${label}: stem too short`)
  if (!Array.isArray(question.options) || question.options.length !== 4) {
    fail(`${label}: expected 4 options, got ${question.options?.length}`)
  } else {
    if (question.options.some((option) => typeof option !== 'string' || !option.trim())) {
      fail(`${label}: empty option`)
    }
    if (new Set(question.options).size !== 4) fail(`${label}: duplicate options`)
    if (question.options.some((option) => option.startsWith('option-'))) fail(`${label}: placeholder option`)
  }
  if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3) {
    fail(`${label}: invalid answer index ${question.answer}`)
  }
  if (typeof question.explanation !== 'string' || question.explanation.trim().length < 5) {
    fail(`${label}: explanation too short`)
  }
  if (!['original', 'adapted-public'].includes(question.source)) {
    fail(`${label}: invalid source ${question.source}`)
  }
  if (question.source === 'adapted-public' && !question.sourceNote) {
    fail(`${label}: adapted-public question needs sourceNote`)
  }
}

const all = []
const ids = new Set()

function addQuestions(list, section) {
  for (const question of list) {
    validateQuestion(question, section)
    if (ids.has(question.id)) fail(`duplicate question id: ${question.id}`)
    ids.add(question.id)
    all.push(question)
  }
}

addQuestions(listening.questions, 'listening')
addQuestions(vocabulary.questions, 'vocabulary')
addQuestions(grammar.questions, 'grammar')
addQuestions(reading.questions, 'reading')

const counts = {
  listening: listening.questions.length,
  vocabulary: vocabulary.questions.length,
  grammar: grammar.questions.length,
  reading: reading.questions.length,
}

if (all.length !== 1200) fail(`expected 1200 questions, got ${all.length}`)
for (const section of sections) {
  if (counts[section] !== 300) fail(`expected 300 ${section} questions, got ${counts[section]}`)
  if (manifest.counts?.[section] !== counts[section]) {
    fail(`manifest count for ${section} is ${manifest.counts?.[section]}, actual ${counts[section]}`)
  }
}
if (manifest.total !== all.length) fail(`manifest total is ${manifest.total}, actual ${all.length}`)
if (manifest.version !== '1.0.0') fail(`unexpected manifest version ${manifest.version}`)

const listeningSets = new Map()
for (const set of listening.sets) {
  if (listeningSets.has(set.id)) fail(`duplicate listening set id: ${set.id}`)
  listeningSets.set(set.id, set)
  if (!levels.includes(set.level)) fail(`listening set ${set.id}: invalid level`)
  if (set.difficulty !== difficultyByLevel[set.level]) fail(`listening set ${set.id}: difficulty mismatch`)
  if (!Array.isArray(set.turns) || set.turns.length < 2) fail(`listening set ${set.id}: missing turns`)
  if (typeof set.script !== 'string' || set.script.length < 20) fail(`listening set ${set.id}: script too short`)
}

const listeningBySet = new Map()
for (const question of listening.questions) {
  if (!question.setId) {
    fail(`listening question ${question.id}: missing setId`)
    continue
  }
  const set = listeningSets.get(question.setId)
  if (!set) fail(`listening question ${question.id}: unknown set ${question.setId}`)
  if (question.level !== set?.level) fail(`listening question ${question.id}: level differs from set`)
  if (!question.script) fail(`listening question ${question.id}: missing script fallback`)
  const list = listeningBySet.get(question.setId) ?? []
  list.push(question)
  listeningBySet.set(question.setId, list)
}
for (const set of listening.sets) {
  const list = listeningBySet.get(set.id) ?? []
  if (list.length !== 1) fail(`listening set ${set.id}: expected exactly 1 question, got ${list.length}`)
}
if (listeningSets.size !== 300) fail(`expected 300 listening sets, got ${listeningSets.size}`)

const passages = new Map()
for (const passage of reading.passages) {
  if (passages.has(passage.id)) fail(`duplicate reading passage id: ${passage.id}`)
  passages.set(passage.id, passage)
  if (!levels.includes(passage.level)) fail(`reading passage ${passage.id}: invalid level`)
  if (passage.difficulty !== difficultyByLevel[passage.level]) fail(`reading passage ${passage.id}: difficulty mismatch`)
  if (typeof passage.text !== 'string' || passage.text.length < 100) fail(`reading passage ${passage.id}: text too short`)
}

const readingByPassage = new Map()
for (const question of reading.questions) {
  if (!question.passageId) {
    fail(`reading question ${question.id}: missing passageId`)
    continue
  }
  const passage = passages.get(question.passageId)
  if (!passage) fail(`reading question ${question.id}: unknown passage ${question.passageId}`)
  if (question.level !== passage?.level) fail(`reading question ${question.id}: level differs from passage`)
  const correctOption = question.options[question.answer]
  if (passage && correctOption && passage.text.toLowerCase().includes(correctOption.toLowerCase())) {
    fail(`reading question ${question.id}: correct answer is copied from the passage`)
  }
  const list = readingByPassage.get(question.passageId) ?? []
  list.push(question)
  readingByPassage.set(question.passageId, list)
}
for (const passage of reading.passages) {
  const list = readingByPassage.get(passage.id) ?? []
  if (list.length !== 5) fail(`reading passage ${passage.id}: expected 5 questions, got ${list.length}`)
}
if (passages.size !== 60) fail(`expected 60 reading passages, got ${passages.size}`)

const uniqueStems = new Set(all.map((question) => question.stem))
if (uniqueStems.size < 800) fail(`expected at least 800 unique stems, got ${uniqueStems.size}`)

const listeningTypes = new Set(listening.questions.map((question) => question.type))
if (listeningTypes.size < 4) fail(`expected at least 4 listening question types, got ${listeningTypes.size}`)

const readingTypes = new Set(reading.questions.map((question) => question.type))
for (const type of ['gist', 'inference', 'vocabulary', 'purpose', 'attitude']) {
  if (!readingTypes.has(type)) fail(`reading bank is missing question type: ${type}`)
}

if (errors.length > 0) {
  console.error(`Validation failed with ${errors.length} error(s):`)
  for (const error of errors.slice(0, 80)) console.error(`  - ${error}`)
  if (errors.length > 80) console.error(`  ... and ${errors.length - 80} more`)
  process.exit(1)
}

console.log(`Bank valid: ${all.length} questions`)
for (const section of sections) console.log(`  ${section.padEnd(12)} ${counts[section]}`)
console.log(`  listening sets ${listeningSets.size}`)
console.log(`  reading passages ${passages.size}`)

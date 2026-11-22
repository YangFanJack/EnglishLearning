import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const dataDir = join(process.cwd(), 'public', 'data')
const read = (name) => JSON.parse(readFileSync(join(dataDir, name), 'utf8'))
const levels = ['A1', 'A2', 'B1', 'B2', 'C1']
const sections = ['listening', 'vocabulary', 'grammar', 'reading']

const manifest = read('manifest.json')
const files = {
  listening: read('listening.json'),
  vocabulary: read('vocabulary.json'),
  grammar: read('grammar.json'),
  reading: read('reading.json'),
}

const questions = sections.flatMap((section) => files[section].questions)
const bySectionLevel = Object.fromEntries(
  sections.map((section) => [
    section,
    Object.fromEntries(levels.map((level) => [level, files[section].questions.filter((question) => question.level === level).length])),
  ]),
)

console.log(`Bank version ${manifest.version} (${manifest.builtAt})`)
console.log(`Total questions: ${questions.length}`)
console.log('')
console.log('By section and level')
console.log(`  ${'section'.padEnd(12)} ${levels.map((level) => level.padStart(5)).join(' ')}   total`)
for (const section of sections) {
  const row = levels.map((level) => String(bySectionLevel[section][level]).padStart(5)).join(' ')
  console.log(`  ${section.padEnd(12)} ${row}   ${String(files[section].questions.length).padStart(5)}`)
}
console.log('')

const bySource = questions.reduce((map, question) => {
  map[question.source] = (map[question.source] ?? 0) + 1
  return map
}, {})
console.log('By source')
for (const [source, count] of Object.entries(bySource)) console.log(`  ${source.padEnd(16)} ${count}`)
console.log('')

const topicCounts = new Map()
for (const question of questions) topicCounts.set(question.topic, (topicCounts.get(question.topic) ?? 0) + 1)
console.log(`Topics (${topicCounts.size})`)
for (const [topic, count] of [...topicCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
  console.log(`  ${topic.padEnd(24)} ${count}`)
}
console.log('')
console.log(`Listening sets: ${files.listening.sets.length}`)
console.log(`Reading passages: ${files.reading.passages.length}`)
console.log(`Unique tags: ${manifest.tags.length}`)

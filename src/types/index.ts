export type Section = 'listening' | 'vocabulary' | 'grammar' | 'reading'

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'

export type Difficulty = 1 | 2 | 3 | 4 | 5

export type QuestionSource = 'original' | 'adapted-public'

export type ExamMode = 'quick' | 'standard' | 'full' | 'section'

export interface Question {
  id: string
  section: Section
  type: string
  level: Level
  difficulty: Difficulty
  topic: string
  tags: string[]
  stem: string
  options: string[]
  answer: number
  explanation: string
  script?: string
  passageId?: string
  setId?: string
  source: QuestionSource
  sourceNote?: string
}

export interface SpeakerTurn {
  speaker: string
  text: string
}

export interface ListeningSet {
  id: string
  level: Level
  difficulty: Difficulty
  topic: string
  tags: string[]
  title: string
  script: string
  turns: SpeakerTurn[]
}

export interface Passage {
  id: string
  title: string
  text: string
  level: Level
  difficulty: Difficulty
  topic: string
  tags: string[]
  source: QuestionSource
  sourceNote?: string
}

export interface Unit {
  id: string
  section: Section
  level: Level
  difficulty: Difficulty
  topic: string
  tags: string[]
  questions: Question[]
  script?: string
  turns?: SpeakerTurn[]
  passage?: Passage
  title?: string
}

export interface BankManifest {
  version: string
  builtAt: string
  total: number
  counts: Record<Section, number>
  levels: Record<Section, Record<Level, number>>
  topics: string[]
  tags: string[]
}

export interface SectionBankFile {
  questions: Question[]
}

export interface ListeningBankFile {
  sets: ListeningSet[]
  questions: Question[]
}

export interface ReadingBankFile {
  passages: Passage[]
  questions: Question[]
}

export interface BankData {
  manifest: BankManifest
  questions: Record<Section, Question[]>
  units: Record<Section, Unit[]>
  passages: Record<string, Passage>
  listeningSets: Record<string, ListeningSet>
  questionById: Record<string, Question>
}

export interface ExamConfig {
  mode: ExamMode
  section?: Section
  questionTarget: number
  durationSec: number
  startTheta: number
  month: string
  seed: number
  timeBased?: boolean
}

export interface ExamAnswer {
  questionId: string
  section: Section
  selected: number | null
  correct: boolean
  timeMs: number
  flagged: boolean
}

export interface SectionState {
  section: Section
  theta: number
  target: number
  units: Unit[]
  currentUnitIndex: number
  answers: Record<string, ExamAnswer>
  plays: Record<string, number>
  flags: Record<string, boolean>
  submitted: boolean
  startedAt: number
  finishedAt?: number
}

export interface ExamSession {
  id: string
  config: ExamConfig
  bankVersion: string
  startedAt: number
  endsAt: number
  status: 'running' | 'finished'
  sections: SectionState[]
  currentSectionIndex: number
  seed: number
  finishedAt?: number
}

export interface SectionResult {
  section: Section
  theta: number
  cefr: Level
  correct: number
  total: number
  accuracy: number
  score: number
  timeSec: number
}

export interface TagResult {
  tag: string
  section: Section
  correct: number
  total: number
  accuracy: number
}

export interface ExamRecord {
  id: string
  mode: ExamMode
  month: string
  startedAt: number
  finishedAt: number
  durationSec: number
  questionCount: number
  correctCount: number
  accuracy: number
  score: number
  cefr: Level
  theta: number
  sections: SectionResult[]
  weakTags: TagResult[]
  tagResults: TagResult[]
  answers: ExamAnswer[]
  config: ExamConfig
  bankVersion: string
}

export interface WrongbookEntry {
  questionId: string
  wrongCount: number
  correctStreak: number
  lastAt: number
  mastered: boolean
  note?: string
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  ttsVoiceURI: string
  ttsRate: number
  defaultMode: ExamMode
  showTimer: boolean
  autoNextSection: boolean
}

export interface QuestionFlag {
  questionId: string
  reason: string
  createdAt: number
}

export interface BackupFile {
  app: 'daien-english-exam'
  version: 1
  exportedAt: number
  settings: AppSettings
  history: ExamRecord[]
  wrongbook: Record<string, WrongbookEntry>
  flags: QuestionFlag[]
}

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info'
  text: string
}

export interface SectionMeta {
  key: Section
  name: string
  short: string
  description: string
  icon: string
  color: string
}

export const SECTION_META: Record<Section, SectionMeta> = {
  listening: {
    key: 'listening',
    name: '听力理解',
    short: '听力',
    description: '短对话、公告与留言，考查细节、推断和说话人意图',
    icon: 'headphones',
    color: '#0f766e',
  },
  vocabulary: {
    key: 'vocabulary',
    name: '词汇运用',
    short: '词汇',
    description: '词义、同义替换、搭配与语境填空',
    icon: 'book',
    color: '#b45309',
  },
  grammar: {
    key: 'grammar',
    name: '语法结构',
    short: '语法',
    description: '时态、从句、非谓语、介词与商务句型',
    icon: 'list',
    color: '#4338ca',
  },
  reading: {
    key: 'reading',
    name: '阅读理解',
    short: '阅读',
    description: '商务邮件、通知、报告与短文的细节、主旨和推断',
    icon: 'chart',
    color: '#be123c',
  },
}

export const SECTIONS: Section[] = ['listening', 'vocabulary', 'grammar', 'reading']

export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1']

export const LEVEL_LABELS: Record<Level, string> = {
  A1: '入门 A1',
  A2: '初级 A2',
  B1: '中级 B1',
  B2: '中高级 B2',
  C1: '高级 C1',
}

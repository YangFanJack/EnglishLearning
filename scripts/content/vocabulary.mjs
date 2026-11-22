import { hashString, LEVELS, makeQuestion, pad, pickDistractors, makeRng, sourceFor } from './shared.mjs'

const MEANING_STEMS = [
  (word) => `Which definition best matches the word “${word}”?`,
  (word) => `What does “${word}” mean?`,
  (word) => `Choose the definition of “${word}”.`,
  (word) => `“${word}” refers to:`,
]

const CLOZE_STEMS = [
  (sentence) => `Choose the best word to complete the sentence: ${sentence}`,
  (sentence) => `Fill in the gap: ${sentence}`,
  (sentence) => `Which word fits in this sentence? ${sentence}`,
  (sentence) => `Complete the sentence with one word: ${sentence}`,
]

const SYNONYM_STEMS = [
  (word) => `Which expression is closest in meaning to “${word}”?`,
  (word) => `Which word could replace “${word}”?`,
  (word) => `Find a synonym for “${word}”.`,
  (word) => `Which option has the same meaning as “${word}”?`,
]

const VOCAB = [
  ['office', 'A1', 'workplace', 'a room or building where people work', 'She works in an ___ near the station.', 'workplace'],
  ['meeting', 'A1', 'meetings', 'an event where people come together to discuss things', 'The team has a ___ every Monday morning.', 'gathering'],
  ['email', 'A1', 'communication', 'a message sent from one computer to another', 'Please send me an ___ with the details.', 'message'],
  ['client', 'A1', 'customers', 'a person or company that buys services', 'The ___ asked for a new price list.', 'customer'],
  ['price', 'A1', 'shopping', 'the amount of money that something costs', 'The ___ of the ticket is too high.', 'cost'],
  ['buy', 'A1', 'shopping', 'to get something by paying money for it', 'We need to ___ new chairs for the office.', 'purchase'],
  ['sell', 'A1', 'sales', 'to give something to someone in exchange for money', 'They ___ software to small companies.', 'trade'],
  ['help', 'A1', 'support', 'to make something easier for someone', 'Can you ___ me carry this box?', 'assist'],
  ['start', 'A1', 'time', 'to begin doing something', 'The class will ___ at nine o’clock.', 'begin'],
  ['finish', 'A1', 'time', 'to complete something', 'I need to ___ the report before lunch.', 'complete'],
  ['question', 'A1', 'communication', 'something that you ask someone', 'She asked a difficult ___ about the budget.', 'query'],
  ['answer', 'A1', 'communication', 'a reply to a question', 'I do not know the ___ to that question.', 'reply'],
  ['work', 'A1', 'workplace', 'to do a job, especially for money', 'I ___ in an office five days a week.', 'do a job'],
  ['call', 'A1', 'communication', 'to telephone someone', 'I will ___ you after the meeting.', 'phone'],
  ['team', 'A1', 'workplace', 'a group of people who work together', 'Our ___ has six people in total.', 'group'],

  ['agenda', 'A2', 'meetings', 'a list of things to discuss at a meeting', 'Please add the budget review to the meeting ___.', 'meeting plan'],
  ['budget', 'A2', 'finance', 'a plan for how much money will be spent', 'The project is already over ___.', 'spending plan'],
  ['deadline', 'A2', 'time', 'the last time or date for finishing something', 'The ___ for the report is Friday at noon.', 'due date'],
  ['invoice', 'A2', 'finance', 'a document that asks a customer to pay for goods or services', 'Please pay the ___ by Monday.', 'bill'],
  ['report', 'A2', 'documents', 'a document that gives information about a subject', 'She wrote a short ___ on last month’s sales.', 'account'],
  ['schedule', 'A2', 'time', 'a plan that shows times and activities', 'My ___ is full this week.', 'timetable'],
  ['project', 'A2', 'projects', 'a planned piece of work with a goal', 'The new ___ starts in May.', 'assignment'],
  ['manager', 'A2', 'workplace', 'a person who leads a team or department', 'The ___ approved my holiday request.', 'supervisor'],
  ['customer', 'A2', 'customers', 'a person who buys goods or services', 'The ___ wants a refund for the damaged item.', 'buyer'],
  ['product', 'A2', 'products', 'something that is made or sold', 'This ___ is very popular in Asia.', 'item'],
  ['service', 'A2', 'customers', 'work done for customers by a company', 'The company offers a free delivery ___.', 'assistance'],
  ['order', 'A2', 'sales', 'a request for goods to be supplied', 'We placed a large ___ for office chairs yesterday.', 'purchase request'],
  ['deliver', 'A2', 'logistics', 'to take goods to a place', 'They will ___ the boxes tomorrow morning.', 'transport'],
  ['confirm', 'A2', 'communication', 'to say that something is definitely true or arranged', 'Please ___ your booking by email.', 'verify'],
  ['arrange', 'A2', 'meetings', 'to plan or organize something', 'I will ___ a meeting with the client.', 'organize'],
  ['attend', 'A2', 'meetings', 'to go to an event or meeting', 'She will ___ the training session on Friday.', 'go to'],
  ['discuss', 'A2', 'meetings', 'to talk about something with other people', 'We need to ___ the new plan before lunch.', 'talk about'],
  ['prepare', 'A2', 'projects', 'to get something ready', 'He is preparing the slides for tomorrow.', 'get ready'],
  ['receive', 'A2', 'communication', 'to get something that someone sends you', 'Did you ___ my message this morning?', 'get'],
  ['suggest', 'A2', 'meetings', 'to offer an idea for other people to consider', 'I ___ that we meet on Tuesday.', 'propose'],

  ['negotiate', 'B1', 'negotiation', 'to discuss something in order to reach an agreement', 'We need to ___ a better price with the supplier.', 'bargain'],
  ['contract', 'B1', 'legal', 'a legal agreement between two or more parties', 'Please sign the ___ before the end of the week.', 'agreement'],
  ['proposal', 'B1', 'projects', 'a formal plan or offer', 'The supplier sent a detailed ___ for the new system.', 'offer'],
  ['estimate', 'B1', 'finance', 'an approximate calculation of cost or size', 'Can you give me a cost ___ for the repairs?', 'approximation'],
  ['refund', 'B1', 'customers', 'money returned to a customer', 'The customer asked for a full ___.', 'repayment'],
  ['complaint', 'B1', 'customers', 'a statement that something is wrong or unsatisfactory', 'We received a ___ about the late delivery.', 'grievance'],
  ['department', 'B1', 'workplace', 'a part of a large organization', 'She works in the sales ___.', 'division'],
  ['colleague', 'B1', 'workplace', 'a person you work with', 'My ___ helped me finish the task.', 'coworker'],
  ['supplier', 'B1', 'logistics', 'a company that provides goods or services', 'The ___ failed to deliver on time.', 'vendor'],
  ['candidate', 'B1', 'recruitment', 'a person who applies for a job', 'The best ___ has five years of experience.', 'applicant'],
  ['interview', 'B1', 'recruitment', 'a meeting to assess whether someone is suitable for a job', 'I have a job ___ tomorrow afternoon.', 'assessment meeting'],
  ['training', 'B1', 'training', 'teaching or learning skills for a job', 'New staff receive two weeks of ___.', 'instruction'],
  ['promote', 'B1', 'recruitment', 'to move someone to a higher position at work', 'They decided to ___ her to regional manager.', 'advance'],
  ['revenue', 'B1', 'finance', 'the money that a company receives from sales', 'Annual ___ grew by ten percent.', 'income'],
  ['expense', 'B1', 'finance', 'money spent on something', 'Travel is our largest monthly ___.', 'outlay'],
  ['quality', 'B1', 'products', 'how good or bad something is', 'We must improve product ___ before the launch.', 'standard'],
  ['efficient', 'B1', 'performance', 'working well without wasting time or money', 'The new approval system is more ___.', 'effective'],
  ['available', 'B1', 'time', 'ready to be used or obtained', 'The meeting room is ___ at three o’clock.', 'accessible'],
  ['require', 'B1', 'requirements', 'to need something', 'The job ___ good communication skills.', 'need'],
  ['provide', 'B1', 'support', 'to give something to someone', 'We ___ training to all new employees.', 'supply'],
  ['achieve', 'B1', 'performance', 'to succeed in reaching a goal', 'The team ___ its sales target last quarter.', 'accomplish'],
  ['improve', 'B1', 'performance', 'to make something better', 'We need to ___ our customer service.', 'enhance'],
  ['reduce', 'B1', 'finance', 'to make something smaller in size or amount', 'The company plans to ___ travel costs.', 'decrease'],
  ['increase', 'B1', 'sales', 'to make something larger in size or amount', 'They plan to ___ production next year.', 'raise'],
  ['recommend', 'B1', 'advice', 'to suggest that something is good or suitable', 'I ___ the new supplier for this project.', 'endorse'],

  ['leverage', 'B2', 'strategy', 'to use something you have in order to gain an advantage', 'We can ___ our network to enter new markets.', 'utilize'],
  ['streamline', 'B2', 'processes', 'to make a process simpler and more efficient', 'The software will ___ our approval process.', 'simplify'],
  ['stakeholder', 'B2', 'projects', 'a person or group with an interest in a project', 'We consulted every ___ before the launch.', 'interested party'],
  ['milestone', 'B2', 'projects', 'an important stage in a project', 'The first ___ is the working prototype.', 'key stage'],
  ['forecast', 'B2', 'finance', 'a prediction of future trends or results', 'The sales ___ for next quarter looks positive.', 'projection'],
  ['compliance', 'B2', 'legal', 'the act of following rules or laws', 'The audit checks our ___ with safety rules.', 'conformity'],
  ['acquisition', 'B2', 'strategy', 'the purchase of another company', 'The ___ will expand our customer base.', 'buyout'],
  ['turnover', 'B2', 'finance', 'the amount of business a company does in a period', 'Annual ___ reached ten million dollars.', 'sales volume'],
  ['retention', 'B2', 'customers', 'the act of keeping customers or employees', 'We improved customer ___ with loyalty rewards.', 'preservation'],
  ['incentive', 'B2', 'motivation', 'something that encourages someone to act', 'The bonus is an ___ to work harder.', 'motivation'],
  ['feasible', 'B2', 'projects', 'possible to do or achieve', 'The plan is technically ___ within six months.', 'achievable'],
  ['comprehensive', 'B2', 'documents', 'including everything necessary', 'The report gives a ___ review of the market.', 'thorough'],
  ['ambiguous', 'B2', 'legal', 'having more than one possible meaning', 'The contract wording is ___ and needs revision.', 'unclear'],
  ['consensus', 'B2', 'meetings', 'general agreement among a group', 'The team reached a ___ on the new design.', 'unanimity'],
  ['mitigate', 'B2', 'risk', 'to reduce the risk or bad effect of something', 'We need to ___ the risk of further delays.', 'lessen'],
  ['allocate', 'B2', 'finance', 'to give money or resources for a particular purpose', 'The manager will ___ the budget next week.', 'assign'],
  ['outsource', 'B2', 'processes', 'to have work done by another company', 'We ___ our IT support to a local firm.', 'contract out'],
  ['benchmark', 'B2', 'performance', 'a standard used for comparison', 'The results are above the industry ___.', 'reference point'],
  ['contingency', 'B2', 'risk', 'a plan for unexpected events', 'We have a ___ fund for emergencies.', 'backup plan'],
  ['discrepancy', 'B2', 'finance', 'a difference between two things that should match', 'The auditor found a ___ in the accounts.', 'inconsistency'],
  ['implement', 'B2', 'processes', 'to put a plan or decision into action', 'We will ___ the new policy next month.', 'execute'],
  ['facilitate', 'B2', 'meetings', 'to make a process or discussion easier', 'The coordinator will ___ the discussion.', 'enable'],
  ['prioritize', 'B2', 'time', 'to decide what is most important', 'We must ___ safety over speed.', 'rank'],
  ['sustainable', 'B2', 'strategy', 'able to continue for a long time without damage', 'The company adopted a ___ growth strategy.', 'long-lasting'],
  ['innovative', 'B2', 'products', 'introducing or using new ideas', 'They launched an ___ product for small firms.', 'inventive'],

  ['paradigm', 'C1', 'strategy', 'a typical model or pattern of thinking', 'The discovery created a new ___ in research.', 'model'],
  ['synergy', 'C1', 'strategy', 'a combined effect that is greater than separate effects', 'The merger created ___ between the two teams.', 'combined effect'],
  ['discretionary', 'C1', 'finance', 'based on personal choice rather than rules', 'The manager has ___ spending power.', 'optional'],
  ['unprecedented', 'C1', 'trends', 'never having happened before', 'The demand for the service was ___.', 'unheard-of'],
  ['lucrative', 'C1', 'finance', 'producing a large amount of money', 'They signed a ___ contract with the retailer.', 'profitable'],
  ['viable', 'C1', 'projects', 'able to work successfully', 'The proposal is commercially ___.', 'workable'],
  ['scrutinize', 'C1', 'analysis', 'to examine something very carefully', 'The board will ___ the figures before approval.', 'examine'],
  ['articulate', 'C1', 'communication', 'to express an idea clearly', 'She can ___ complex ideas in simple language.', 'express'],
  ['consolidate', 'C1', 'strategy', 'to combine things into one', 'We will ___ the two departments next year.', 'combine'],
  ['deteriorate', 'C1', 'performance', 'to become worse', 'Service levels began to ___ after the cuts.', 'worsen'],
  ['exacerbate', 'C1', 'risk', 'to make a bad situation worse', 'The delay will ___ the shortage of parts.', 'aggravate'],
  ['pragmatic', 'C1', 'strategy', 'practical rather than theoretical', 'We need a ___ solution that works now.', 'practical'],
  ['robust', 'C1', 'technology', 'strong and able to withstand difficult conditions', 'The system is ___ enough for high traffic.', 'sturdy'],
  ['redundant', 'C1', 'processes', 'no longer needed or duplicated', 'The old approval step is now ___.', 'unnecessary'],
  ['candid', 'C1', 'communication', 'honest and direct', 'She gave a ___ assessment of the risks.', 'frank'],
]

export function buildVocabulary() {
  const questions = []
  const definitions = VOCAB.map((entry) => entry[3])
  const synonyms = VOCAB.map((entry) => entry[5])
  const byLevel = Object.fromEntries(LEVELS.map((level) => [level, VOCAB.filter((entry) => entry[1] === level)]))

  VOCAB.forEach((entry, index) => {
    const [word, level, topic, definition, sentence, synonym] = entry
    const serial = pad(index + 1)
    const sourceInfo = sourceFor(index)
    const rng = makeRng(`vocab:${word}`)

    const meaningDistractors = pickDistractors(definition, definitions, 3, rng)
    questions.push(
      makeQuestion({
        id: `vocab-${serial}-meaning`,
        section: 'vocabulary',
        type: 'meaning',
        level,
        topic,
        tags: [topic, 'meaning', 'word-recognition'],
        stem: MEANING_STEMS[hashString(`${word}:meaning`) % MEANING_STEMS.length](word),
        correct: definition,
        distractors: meaningDistractors,
        explanation: `“${word}” means ${definition}.`,
        ...sourceInfo,
      }),
    )

    const levelIndex = LEVELS.indexOf(level)
    const neighborWords = [LEVELS[levelIndex - 1], level, LEVELS[levelIndex + 1]]
      .filter(Boolean)
      .flatMap((item) => byLevel[item].map((entryItem) => entryItem[0]))
    const clozeDistractors = pickDistractors(word, neighborWords, 3, rng)
    questions.push(
      makeQuestion({
        id: `vocab-${serial}-cloze`,
        section: 'vocabulary',
        type: 'cloze',
        level,
        topic,
        tags: [topic, 'context', 'collocation'],
        stem: CLOZE_STEMS[hashString(`${word}:cloze`) % CLOZE_STEMS.length](sentence),
        correct: word,
        distractors: clozeDistractors,
        explanation: `The completed sentence is: “${sentence.replace('___', word)}” Here, “${word}” means ${definition}.`,
        ...sourceInfo,
      }),
    )

    const synonymDistractors = pickDistractors(synonym, synonyms, 3, rng)
    questions.push(
      makeQuestion({
        id: `vocab-${serial}-synonym`,
        section: 'vocabulary',
        type: 'synonym',
        level,
        topic,
        tags: [topic, 'synonym', 'paraphrase'],
        stem: SYNONYM_STEMS[hashString(`${word}:synonym`) % SYNONYM_STEMS.length](word),
        correct: synonym,
        distractors: synonymDistractors,
        explanation: `“${synonym}” is the closest expression in meaning to “${word}”, which means ${definition}.`,
        ...sourceInfo,
      }),
    )
  })

  return questions
}


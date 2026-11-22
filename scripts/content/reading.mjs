import { DIFFICULTY, makeQuestion, pad, sourceFor } from './shared.mjs'
import { focusFor } from './reading-focus.mjs'

const q = (type, stem, correct, pool, explanation) => ({
  type,
  stem,
  correct,
  distractors: pool.filter((item) => item !== correct).slice(0, 3),
  explanation,
})

const qo = (type, stem, correct, distractors, explanation) => ({
  type,
  stem,
  correct,
  distractors,
  explanation,
})

const PASSAGES = [
  {
    key: 'event-invitation',
    level: 'A1',
    topic: 'events',
    tags: ['invitation', 'notice'],
    title: (v) => v.event,
    variants: [
      { event: 'a team lunch', date: 'Friday 12 May', time: '12:30 p.m.', place: 'the Riverside Café', reply: 'email events@hartley.com', deadline: '8 May' },
      { event: 'a retirement party', date: 'Saturday 3 June', time: '6 p.m.', place: 'the Grand Hotel', reply: 'email Maria in HR', deadline: '28 May' },
      { event: 'a product demo', date: 'Tuesday 20 June', time: '10 a.m.', place: 'the Innovation Centre', reply: 'register on the company website', deadline: '15 June' },
    ],
    text: (v) =>
      `Subject: You are invited!\n\nWe would like to invite you to ${v.event} on ${v.date} at ${v.time}. It will take place at ${v.place}.\n\nPlease reply by ${v.reply} before ${v.deadline}. We hope you can join us.\n\nBest regards,\nThe Events Team`,
    questions: (v) => [
      q('detail', 'What event is being held?', v.event, ['a team lunch', 'a retirement party', 'a product demo', 'a training session'], `The invitation is for ${v.event}.`),
      q('detail', 'When is the event?', v.date, ['Friday 12 May', 'Saturday 3 June', 'Tuesday 20 June', 'Monday 26 June'], `The event is on ${v.date}.`),
      q('detail', 'Where will the event take place?', v.place, ['the Riverside Café', 'the Grand Hotel', 'the Innovation Centre', 'the training room'], `The event will be at ${v.place}.`),
      q('detail', 'How should people reply?', v.reply, ['email events@hartley.com', 'email Maria in HR', 'register on the company website', 'call the reception desk'], `People should reply by ${v.reply}.`),
      qo('purpose', 'What is the main purpose of this message?', 'To invite people to an event', ['To complain about a service', 'To advertise a new product', 'To cancel a meeting'], 'The message clearly invites people to an event and asks them to reply.'),
    ],
  },
  {
    key: 'travel-itinerary',
    level: 'A1',
    topic: 'travel',
    tags: ['itinerary', 'business-trip'],
    title: (v) => `Trip to ${v.city}`,
    variants: [
      { city: 'Berlin', flight: 'BA 982 at 7:40 a.m.', hotel: 'the City Hotel', meeting: 'the client office at 2 p.m.', back: 'Thursday evening' },
      { city: 'Paris', flight: 'AF 1681 at 8:15 a.m.', hotel: 'the Central Inn', meeting: 'the trade fair at 11 a.m.', back: 'Friday afternoon' },
      { city: 'Milan', flight: 'AZ 205 at 6:55 a.m.', hotel: 'the Park Hotel', meeting: 'the supplier factory at 3 p.m.', back: 'Saturday morning' },
    ],
    text: (v) =>
      `Business trip itinerary\n\nDestination: ${v.city}\nFlight: ${v.flight}\nHotel: ${v.hotel}\n\nOn the first day, you will visit ${v.meeting}. Please take a taxi from the airport to the hotel. The return flight is on ${v.back}.\n\nIf you need to change anything, contact the travel desk.`,
    questions: (v) => [
      q('detail', 'Where is the traveller going?', v.city, ['Berlin', 'Paris', 'Milan', 'Madrid'], `The destination is ${v.city}.`),
      q('detail', 'What is the flight time?', v.flight, ['BA 982 at 7:40 a.m.', 'AF 1681 at 8:15 a.m.', 'AZ 205 at 6:55 a.m.', 'LH 410 at 9:20 a.m.'], `The itinerary lists ${v.flight}.`),
      q('detail', 'Where will the traveller stay?', v.hotel, ['the City Hotel', 'the Central Inn', 'the Park Hotel', 'the Airport Hotel'], `The hotel is ${v.hotel}.`),
      q('detail', 'What is the first business appointment?', v.meeting, ['the client office at 2 p.m.', 'the trade fair at 11 a.m.', 'the supplier factory at 3 p.m.', 'the hotel reception at 4 p.m.'], `The first appointment is ${v.meeting}.`),
      q('detail', 'When is the return flight?', v.back, ['Thursday evening', 'Friday afternoon', 'Saturday morning', 'Sunday evening'], `The return flight is on ${v.back}.`),
    ],
  },
  {
    key: 'meeting-agenda',
    level: 'A2',
    topic: 'meetings',
    tags: ['agenda', 'email'],
    title: (v) => `Agenda: ${v.meeting}`,
    variants: [
      { meeting: 'the quarterly sales meeting', date: 'Monday 14 March', time: '9:30 a.m.', place: 'the boardroom', first: 'reviewing last quarter’s results', presenter: 'the sales director', prepare: 'the regional sales figures' },
      { meeting: 'the project kick-off', date: 'Wednesday 5 April', time: '2 p.m.', place: 'Room 6', first: 'confirming the project scope', presenter: 'the project manager', prepare: 'a list of open questions' },
      { meeting: 'the budget planning session', date: 'Friday 22 September', time: '10 a.m.', place: 'the finance meeting room', first: 'reviewing department budgets', presenter: 'the finance director', prepare: 'last year’s spending report' },
    ],
    text: (v) =>
      `Subject: Agenda for ${v.meeting}\n\nDear colleagues,\n\nOur next meeting will be on ${v.date} at ${v.time} in ${v.place}. The first item is ${v.first}, presented by ${v.presenter}. We will then discuss the remaining action points.\n\nPlease prepare ${v.prepare} before the meeting and send any additional items to me by Friday.\n\nBest regards,\nAlex`,
    questions: (v) => [
      q('detail', 'When is the meeting?', `${v.date} at ${v.time}`, ['Monday 14 March at 9:30 a.m.', 'Wednesday 5 April at 2 p.m.', 'Friday 22 September at 10 a.m.', 'Tuesday 4 July at 11 a.m.'], `The email says the meeting is on ${v.date} at ${v.time}.`),
      q('detail', 'What is the first agenda item?', v.first, ['reviewing last quarter’s results', 'confirming the project scope', 'reviewing department budgets', 'discussing the office move'], `The first item is ${v.first}.`),
      q('detail', 'Who will present the first item?', v.presenter, ['the sales director', 'the project manager', 'the finance director', 'the HR manager'], `The presenter is ${v.presenter}.`),
      q('detail', 'Where is the meeting?', v.place, ['the boardroom', 'Room 6', 'the finance meeting room', 'the training room'], `The meeting is in ${v.place}.`),
      q('detail', 'What should colleagues prepare?', v.prepare, ['the regional sales figures', 'a list of open questions', 'last year’s spending report', 'the new marketing plan'], `Colleagues should prepare ${v.prepare}.`),
    ],
  },
  {
    key: 'training-announcement',
    level: 'A2',
    topic: 'training',
    tags: ['training', 'announcement'],
    title: (v) => v.course,
    variants: [
      { course: 'a customer service workshop', date: 'Thursday 18 May', duration: 'half a day', audience: 'all front-line staff', register: 'email training@hartley.com', place: 'the training room' },
      { course: 'a presentation skills course', date: 'Tuesday 6 June', duration: 'two days', audience: 'managers and team leaders', register: 'sign up on the intranet', place: 'the Innovation Centre' },
      { course: 'a first-aid training session', date: 'Friday 30 June', duration: 'three hours', audience: 'office safety officers', register: 'contact the HR team', place: 'the health and safety office' },
    ],
    text: (v) =>
      `Training announcement\n\nWe are running ${v.course} on ${v.date}. The session will last ${v.duration} and will take place in ${v.place}.\n\nThis training is for ${v.audience}. To register, please ${v.register} by the end of the week. Places are limited, so early registration is recommended.`,
    questions: (v) => [
      q('detail', 'What training is being offered?', v.course, ['a customer service workshop', 'a presentation skills course', 'a first-aid training session', 'a finance for managers course'], `The announcement is for ${v.course}.`),
      q('detail', 'When is the training?', v.date, ['Thursday 18 May', 'Tuesday 6 June', 'Friday 30 June', 'Monday 10 July'], `The training is on ${v.date}.`),
      q('detail', 'How long does the training last?', v.duration, ['half a day', 'two days', 'three hours', 'one week'], `The session lasts ${v.duration}.`),
      q('detail', 'Who is the training for?', v.audience, ['all front-line staff', 'managers and team leaders', 'office safety officers', 'new graduates'], `The training is for ${v.audience}.`),
      q('detail', 'How should people register?', v.register, ['email training@hartley.com', 'sign up on the intranet', 'contact the HR team', 'call the reception desk'], `People should ${v.register}.`),
    ],
  },
  {
    key: 'conference-schedule',
    level: 'A2',
    topic: 'events',
    tags: ['conference', 'schedule'],
    title: (v) => v.conference,
    variants: [
      { conference: 'the Annual Marketing Conference', day: 'Thursday', keynote: 'a talk on brand storytelling', speaker: 'Dr. Helen Ward', workshop: 'social media analytics', time: '2 p.m.', room: 'Hall B' },
      { conference: 'the Digital Sales Summit', day: 'Friday', keynote: 'a talk on AI in sales', speaker: 'James Okoro', workshop: 'building online pipelines', time: '11 a.m.', room: 'Room 4' },
      { conference: 'the HR Innovation Forum', day: 'Monday', keynote: 'a talk on hybrid work', speaker: 'Sofia Mendes', workshop: 'recruiting remote talent', time: '3:30 p.m.', room: 'the main auditorium' },
    ],
    text: (v) =>
      `${v.conference}\n\nJoin us on ${v.day} for a full day of talks and workshops. The keynote is ${v.keynote} by ${v.speaker}. In the afternoon, there will be a workshop on ${v.workshop} at ${v.time} in ${v.room}.\n\nLunch will be served at 12:30 in the exhibition hall. Please collect your badge at the registration desk before the keynote begins.`,
    questions: (v) => [
      q('detail', 'What is the keynote about?', v.keynote, ['a talk on brand storytelling', 'a talk on AI in sales', 'a talk on hybrid work', 'a talk on customer loyalty'], `The keynote is ${v.keynote}.`),
      q('detail', 'Who is the keynote speaker?', v.speaker, ['Dr. Helen Ward', 'James Okoro', 'Sofia Mendes', 'Dr. Peter Lang'], `The speaker is ${v.speaker}.`),
      q('detail', 'What is the afternoon workshop about?', v.workshop, ['social media analytics', 'building online pipelines', 'recruiting remote talent', 'financial planning'], `The workshop is on ${v.workshop}.`),
      q('detail', 'What time is the workshop?', v.time, ['11 a.m.', '2 p.m.', '3:30 p.m.', '4:45 p.m.'], `The workshop is at ${v.time}.`),
      q('detail', 'Where is lunch served?', 'in the exhibition hall', ['in Hall B', 'in Room 4', 'in the main auditorium', 'in the exhibition hall'], 'The text says lunch will be served in the exhibition hall.'),
    ],
  },
  {
    key: 'project-status',
    level: 'B1',
    topic: 'projects',
    tags: ['report', 'status'],
    title: (v) => `Status report: ${v.project}`,
    variants: [
      { project: 'the website redesign', progress: '70%', milestone: 'the homepage prototype', risk: 'a delay in content approval', next: 'finalize the product pages', budget: 'on budget' },
      { project: 'the CRM migration', progress: '45%', milestone: 'the data clean-up', risk: 'missing customer records', next: 'test the import process', budget: '10% over budget' },
      { project: 'the office relocation', progress: '85%', milestone: 'the new lease signed', risk: 'furniture delivery delays', next: 'confirm the moving date', budget: 'under budget' },
    ],
    text: (v) =>
      `Project status report: ${v.project}\n\nThe project is currently ${v.progress} complete. We have reached the milestone of ${v.milestone}. The main risk is ${v.risk}, which could affect the timeline if it is not resolved this week.\n\nFinancially, the project is ${v.budget}. The next step is to ${v.next}. Overall, the project remains on track, but close monitoring is needed.`,
    questions: (v) => [
      q('detail', 'How much of the project is complete?', v.progress, ['45%', '70%', '85%', '95%'], `The project is ${v.progress} complete.`),
      q('detail', 'What milestone has been reached?', v.milestone, ['the homepage prototype', 'the data clean-up', 'the new lease signed', 'the final launch'], `The team has reached ${v.milestone}.`),
      q('detail', 'What is the main risk?', v.risk, ['a delay in content approval', 'missing customer records', 'furniture delivery delays', 'a shortage of staff'], `The main risk is ${v.risk}.`),
      q('detail', 'What is the next step?', v.next, ['finalize the product pages', 'test the import process', 'confirm the moving date', 'hire a new project manager'], `The next step is to ${v.next}.`),
      q('inference', 'What is the overall assessment of the project?', 'It is progressing but needs close monitoring', ['It should be cancelled', 'It is complete and needs no action', 'It has failed to meet every milestone'], 'The report says the project remains on track but close monitoring is needed.'),
    ],
  },
  {
    key: 'complaint-response',
    level: 'B1',
    topic: 'customers',
    tags: ['complaint', 'response'],
    title: (v) => `Response to complaint: ${v.product}`,
    variants: [
      { customer: 'Ms. Turner', product: 'a coffee machine', problem: 'it stopped working after three days', solution: 'a replacement machine', compensation: 'a $20 voucher', time: 'within five working days' },
      { customer: 'Mr. Ali', product: 'an office chair', problem: 'the wheels were broken on arrival', solution: 'a free repair', compensation: 'free delivery on the next order', time: 'by the end of the week' },
      { customer: 'Dr. Novak', product: 'a printer', problem: 'it kept jamming during printing', solution: 'a full refund', compensation: 'a $50 store credit', time: 'within ten working days' },
    ],
    text: (v) =>
      `Dear ${v.customer},\n\nThank you for contacting us about ${v.product}. We are sorry to hear that ${v.problem}. We understand how frustrating this must be.\n\nWe have arranged ${v.solution} and will also offer you ${v.compensation} as an apology. This should be completed ${v.time}.\n\nWe appreciate your patience and hope to restore your confidence in our service.\n\nKind regards,\nCustomer Support Team`,
    questions: (v) => [
      q('detail', 'Why is the company writing?', 'To respond to a complaint', ['To advertise a new product', 'To invite the customer to an event', 'To ask for payment'], 'The letter responds to a customer complaint and offers a solution.'),
      q('detail', 'What was the problem?', v.problem, ['it stopped working after three days', 'the wheels were broken on arrival', 'it kept jamming during printing', 'it arrived with the wrong colour'], `The customer reported that ${v.problem}.`),
      q('detail', 'What solution is offered?', v.solution, ['a replacement machine', 'a free repair', 'a full refund', 'a different product'], `The company offers ${v.solution}.`),
      q('detail', 'What compensation is included?', v.compensation, ['a $20 voucher', 'free delivery on the next order', 'a $50 store credit', 'an extended warranty'], `The compensation is ${v.compensation}.`),
      q('detail', 'When will the issue be resolved?', v.time, ['within five working days', 'by the end of the week', 'within ten working days', 'within one month'], `The issue should be resolved ${v.time}.`),
    ],
  },
  {
    key: 'job-offer',
    level: 'B1',
    topic: 'recruitment',
    tags: ['job-offer', 'letter'],
    title: (v) => `Job offer: ${v.role}`,
    variants: [
      { candidate: 'Ms. Lopez', role: 'Marketing Manager', salary: '$68,000', start: '3 July', probation: 'three months', accept: 'sign and return the attached contract' },
      { candidate: 'Mr. Chen', role: 'Financial Analyst', salary: '$54,000', start: '15 August', probation: 'six months', accept: 'email HR to confirm acceptance' },
      { candidate: 'Dr. Smith', role: 'Head of Research', salary: '$92,000', start: '1 September', probation: 'six months', accept: 'complete the online onboarding form' },
    ],
    text: (v) =>
      `Dear ${v.candidate},\n\nWe are delighted to offer you the position of ${v.role} at Hartley Group. Your starting salary will be ${v.salary} per year, and your start date will be ${v.start}.\n\nThe role is subject to a ${v.probation} probation period. To accept this offer, please ${v.accept} by 20 June.\n\nWe look forward to welcoming you to the team.\n\nYours sincerely,\nRebecca Hall\nHR Director`,
    questions: (v) => [
      q('detail', 'What position is being offered?', v.role, ['Marketing Manager', 'Financial Analyst', 'Head of Research', 'Sales Director'], `The offer is for ${v.role}.`),
      q('detail', 'What is the starting salary?', v.salary, ['$54,000', '$68,000', '$92,000', '$110,000'], `The salary is ${v.salary}.`),
      q('detail', 'When is the start date?', v.start, ['3 July', '15 August', '1 September', '20 June'], `The start date is ${v.start}.`),
      q('detail', 'How long is the probation period?', v.probation, ['three months', 'six months', 'one year', 'two months'], `The probation period is ${v.probation}.`),
      q('detail', 'How should the candidate accept the offer?', v.accept, ['sign and return the attached contract', 'email HR to confirm acceptance', 'complete the online onboarding form', 'call the HR director'], `The candidate should ${v.accept}.`),
    ],
  },
  {
    key: 'invoice-reminder',
    level: 'B1',
    topic: 'finance',
    tags: ['invoice', 'payment'],
    title: (v) => `Invoice reminder: ${v.invoice}`,
    variants: [
      { invoice: 'INV-2087', amount: '$4,600', due: '15 May', late: 'a 2% late fee', method: 'bank transfer', action: 'pay the outstanding amount' },
      { invoice: 'INV-3341', amount: '$1,275', due: '30 June', late: 'a $50 administration fee', method: 'credit card', action: 'contact us if the invoice is incorrect' },
      { invoice: 'INV-5190', amount: '$9,800', due: '12 July', late: 'interest at 1.5% per month', method: 'direct debit', action: 'confirm the payment date' },
    ],
    text: (v) =>
      `Subject: Reminder for invoice ${v.invoice}\n\nDear Customer,\n\nOur records show that invoice ${v.invoice} for ${v.amount} was due on ${v.due}. We have not yet received payment.\n\nIf payment is not received within seven days, ${v.late} will be applied. You can pay by ${v.method} using the details on the invoice.\n\nPlease ${v.action} as soon as possible. If you have already paid, please disregard this reminder.\n\nKind regards,\nAccounts Receivable`,
    questions: (v) => [
      q('detail', 'How much is the outstanding invoice?', v.amount, ['$1,275', '$4,600', '$9,800', '$12,000'], `The invoice is for ${v.amount}.`),
      q('detail', 'When was the invoice due?', v.due, ['15 May', '30 June', '12 July', '31 August'], `The invoice was due on ${v.due}.`),
      q('detail', 'What happens if payment is late?', v.late, ['a 2% late fee', 'a $50 administration fee', 'interest at 1.5% per month', 'the account will be closed'], `The reminder says ${v.late} will be applied.`),
      q('detail', 'What payment method is mentioned?', v.method, ['bank transfer', 'credit card', 'direct debit', 'cash'], `Payment can be made by ${v.method}.`),
      q('detail', 'What should the customer do?', v.action, ['pay the outstanding amount', 'contact us if the invoice is incorrect', 'confirm the payment date', 'request a new invoice'], `The customer should ${v.action}.`),
    ],
  },
  {
    key: 'office-relocation',
    level: 'B1',
    topic: 'office',
    tags: ['relocation', 'notice'],
    title: (v) => `Office move to ${v.address}`,
    variants: [
      { address: '18 King Street', date: 'the weekend of 10 June', reason: 'the current lease is ending', transport: 'a free shuttle bus from the station', contact: 'facilities@hartley.com' },
      { address: '42 Harbour Road', date: 'the first week of July', reason: 'the company is expanding', transport: 'secure bicycle parking', contact: 'the facilities team' },
      { address: '7 Park Avenue', date: 'the end of August', reason: 'the building is being renovated', transport: 'a nearby underground station', contact: 'your line manager' },
    ],
    text: (v) =>
      `Office relocation notice\n\nWe will move to ${v.address} during ${v.date}. The move is necessary because ${v.reason}.\n\nAll staff should pack their personal belongings by the Friday before the move. IT will move computers and phones. For transport, ${v.transport} will be available.\n\nIf you have questions, please contact ${v.contact}. We will share the new floor plan next week.`,
    questions: (v) => [
      q('detail', 'Where is the new office?', v.address, ['18 King Street', '42 Harbour Road', '7 Park Avenue', '25 Queen Square'], `The new office is at ${v.address}.`),
      q('detail', 'When will the move happen?', v.date, ['the weekend of 10 June', 'the first week of July', 'the end of August', 'the middle of September'], `The move will happen during ${v.date}.`),
      q('detail', 'Why is the company moving?', v.reason, ['the current lease is ending', 'the company is expanding', 'the building is being renovated', 'the office is too small'], `The move is necessary because ${v.reason}.`),
      q('detail', 'What transport information is given?', v.transport, ['a free shuttle bus from the station', 'secure bicycle parking', 'a nearby underground station', 'a company car service'], `The notice mentions ${v.transport}.`),
      q('detail', 'Who should staff contact with questions?', v.contact, ['facilities@hartley.com', 'the facilities team', 'your line manager', 'the IT helpdesk'], `Staff should contact ${v.contact}.`),
    ],
  },
  {
    key: 'recruitment-ad',
    level: 'B1',
    topic: 'recruitment',
    tags: ['advertisement', 'job'],
    title: (v) => `Vacancy: ${v.role}`,
    variants: [
      { role: 'Sales Executive', location: 'Manchester', requirement: 'two years of B2B sales experience', salary: '$38,000–$45,000', apply: 'send a CV and cover letter to jobs@hartley.com', deadline: '31 May' },
      { role: 'Data Analyst', location: 'London', requirement: 'strong Excel and SQL skills', salary: '$42,000–$52,000', apply: 'complete the online application form', deadline: '18 June' },
      { role: 'Customer Success Manager', location: 'Remote (UK)', requirement: 'experience managing enterprise clients', salary: '$50,000–$60,000', apply: 'email your CV to the HR team', deadline: '4 July' },
    ],
    text: (v) =>
      `We are hiring: ${v.role}\n\nLocation: ${v.location}\nSalary: ${v.salary}\n\nThe successful candidate will have ${v.requirement}. You will work with a supportive team and receive 25 days of holiday, a pension, and flexible working options.\n\nTo apply, ${v.apply} by ${v.deadline}. We welcome applications from candidates of all backgrounds.`,
    questions: (v) => [
      q('detail', 'What role is advertised?', v.role, ['Sales Executive', 'Data Analyst', 'Customer Success Manager', 'Marketing Assistant'], `The vacancy is for ${v.role}.`),
      q('detail', 'Where is the job based?', v.location, ['Manchester', 'London', 'Remote (UK)', 'Birmingham'], `The job is based in ${v.location}.`),
      q('detail', 'What experience or skill is required?', v.requirement, ['two years of B2B sales experience', 'strong Excel and SQL skills', 'experience managing enterprise clients', 'a driving licence'], `The advert requires ${v.requirement}.`),
      q('detail', 'What is the salary range?', v.salary, ['$38,000–$45,000', '$42,000–$52,000', '$50,000–$60,000', '$60,000–$70,000'], `The salary range is ${v.salary}.`),
      q('detail', 'How should candidates apply?', v.apply, ['send a CV and cover letter to jobs@hartley.com', 'complete the online application form', 'email your CV to the HR team', 'call the recruitment hotline'], `Candidates should ${v.apply}.`),
    ],
  },
  {
    key: 'it-maintenance',
    level: 'B1',
    topic: 'technology',
    tags: ['IT', 'maintenance'],
    title: (v) => `Maintenance: ${v.system}`,
    variants: [
      { system: 'the email system', when: 'Saturday 10 June from 8 p.m. to 11 p.m.', duration: 'three hours', impact: 'email will be unavailable', action: 'save your work and log out', contact: 'the IT helpdesk' },
      { system: 'the finance database', when: 'Sunday 18 June from 6 a.m. to 9 a.m.', duration: 'three hours', impact: 'invoices cannot be processed', action: 'submit urgent requests by Friday', contact: 'finance.support@hartley.com' },
      { system: 'the customer portal', when: 'Wednesday 21 June from 10 p.m. to midnight', duration: 'two hours', impact: 'customers cannot log in', action: 'inform affected clients', contact: 'your account manager' },
    ],
    text: (v) =>
      `IT maintenance notice\n\nWe will carry out essential maintenance on ${v.system} on ${v.when}. The work will take approximately ${v.duration}.\n\nDuring this time, ${v.impact}. Please ${v.action} before the maintenance begins. We apologize for any inconvenience.\n\nIf you have an urgent issue, contact ${v.contact}.`,
    questions: (v) => [
      q('detail', 'Which system will be maintained?', v.system, ['the email system', 'the finance database', 'the customer portal', 'the HR intranet'], `The maintenance is for ${v.system}.`),
      q('detail', 'When will the maintenance take place?', v.when, ['Saturday 10 June from 8 p.m. to 11 p.m.', 'Sunday 18 June from 6 a.m. to 9 a.m.', 'Wednesday 21 June from 10 p.m. to midnight', 'Friday 30 June from 1 p.m. to 4 p.m.'], `The maintenance is on ${v.when}.`),
      q('detail', 'How long will the work take?', v.duration, ['two hours', 'three hours', 'four hours', 'all day'], `The work will take about ${v.duration}.`),
      q('detail', 'What is the impact during maintenance?', v.impact, ['email will be unavailable', 'invoices cannot be processed', 'customers cannot log in', 'the website will be slow'], `During the work, ${v.impact}.`),
      q('detail', 'What should staff do before maintenance?', v.action, ['save your work and log out', 'submit urgent requests by Friday', 'inform affected clients', 'back up the database'], `Staff should ${v.action}.`),
    ],
  },
  {
    key: 'product-launch-pr',
    level: 'B2',
    topic: 'products',
    tags: ['press-release', 'launch'],
    title: (v) => `Launch: ${v.product}`,
    variants: [
      { product: 'the SmartDesk 2', date: '12 September', market: 'small businesses', feature: 'automatic height adjustment', price: '$499', quote: 'We wanted to make ergonomic furniture affordable' },
      { product: 'the EcoPack Pro', date: '3 October', market: 'food retailers', feature: 'fully compostable packaging', price: '$0.35 per unit', quote: 'Sustainability should not mean higher costs' },
      { product: 'the FlowPay app', date: '15 November', market: 'freelancers', feature: 'instant invoice payments', price: '$9.99 per month', quote: 'Freelancers need cash flow they can rely on' },
    ],
    text: (v) =>
      `Hartley Group announces the launch of ${v.product}, available from ${v.date}. The product is designed for ${v.market} and features ${v.feature}.\n\n“${v.quote},” said CEO Laura Bennett. The launch follows eighteen months of development and testing with more than 200 customers.\n\n${v.product} will be priced at ${v.price}. It will be available through the company website and selected retail partners.`,
    questions: (v) => [
      q('detail', 'What product is being launched?', v.product, ['the SmartDesk 2', 'the EcoPack Pro', 'the FlowPay app', 'the OfficeHub platform'], `The launch is for ${v.product}.`),
      q('detail', 'When will the product be available?', v.date, ['12 September', '3 October', '15 November', '1 December'], `The product is available from ${v.date}.`),
      q('detail', 'Who is the target market?', v.market, ['small businesses', 'food retailers', 'freelancers', 'large manufacturers'], `The product is designed for ${v.market}.`),
      q('detail', 'What is the key feature?', v.feature, ['automatic height adjustment', 'fully compostable packaging', 'instant invoice payments', 'voice-controlled settings'], `The key feature is ${v.feature}.`),
      q('detail', 'What is the price?', v.price, ['$499', '$0.35 per unit', '$9.99 per month', '$1,200'], `The price is ${v.price}.`),
    ],
  },
  {
    key: 'policy-update',
    level: 'B2',
    topic: 'legal',
    tags: ['policy', 'update'],
    title: (v) => `Policy update: ${v.policy}`,
    variants: [
      { policy: 'the remote working policy', effective: '1 July', change: 'employees may work remotely up to three days a week', affected: 'all office-based staff', action: 'submit a remote working agreement' },
      { policy: 'the expenses policy', effective: '1 August', change: 'receipts are required for all expenses over $25', affected: 'staff who travel for work', action: 'upload receipts to the finance system' },
      { policy: 'the data protection policy', effective: '15 September', change: 'customer data may only be stored on approved systems', affected: 'all customer-facing teams', action: 'complete the data protection training' },
    ],
    text: (v) =>
      `Policy update: ${v.policy}\n\nFrom ${v.effective}, ${v.change}. This change applies to ${v.affected}.\n\nThe update is intended to improve consistency and reduce risk. Managers should discuss the changes with their teams this month.\n\nTo comply with the new policy, staff must ${v.action} before the effective date. The full policy is available on the intranet.`,
    questions: (v) => [
      q('detail', 'Which policy is being updated?', v.policy, ['the remote working policy', 'the expenses policy', 'the data protection policy', 'the health and safety policy'], `The update concerns ${v.policy}.`),
      q('detail', 'When does the new policy take effect?', v.effective, ['1 July', '1 August', '15 September', '1 October'], `The policy takes effect from ${v.effective}.`),
      q('detail', 'What is the main change?', v.change, ['employees may work remotely up to three days a week', 'receipts are required for all expenses over $25', 'customer data may only be stored on approved systems', 'all meetings must be held online'], `The main change is that ${v.change}.`),
      q('detail', 'Who is affected?', v.affected, ['all office-based staff', 'staff who travel for work', 'all customer-facing teams', 'senior managers only'], `The policy applies to ${v.affected}.`),
      q('detail', 'What must staff do before the effective date?', v.action, ['submit a remote working agreement', 'upload receipts to the finance system', 'complete the data protection training', 'attend a team meeting'], `Staff must ${v.action}.`),
    ],
  },
  {
    key: 'supplier-proposal',
    level: 'B2',
    topic: 'procurement',
    tags: ['proposal', 'supplier'],
    title: (v) => `Proposal from ${v.supplier}`,
    variants: [
      { supplier: 'GreenLine Office Supplies', product: 'recycled printer paper', price: '$28 per box', delivery: 'within three working days', warranty: 'a full replacement for damaged goods', advantage: 'a lower carbon footprint' },
      { supplier: 'Nordic Furniture Co.', product: 'ergonomic office chairs', price: '$210 per chair', delivery: 'within two weeks', warranty: 'a five-year warranty', advantage: 'certified ergonomic design' },
      { supplier: 'SecureIT Systems', product: 'managed cybersecurity services', price: '$4,500 per month', delivery: 'onboarding within ten days', warranty: 'a 99.9% service guarantee', advantage: '24-hour monitoring' },
    ],
    text: (v) =>
      `Proposal from ${v.supplier}\n\nThank you for the opportunity to submit this proposal. We are pleased to offer ${v.product} at ${v.price}. Delivery will be completed ${v.delivery}.\n\nOur offer includes ${v.warranty}. The main advantage of working with us is ${v.advantage}. We have supplied similar services to more than 150 organisations across Europe.\n\nWe would be happy to arrange a meeting to discuss the proposal in more detail.`,
    questions: (v) => [
      q('detail', 'Which supplier sent the proposal?', v.supplier, ['GreenLine Office Supplies', 'Nordic Furniture Co.', 'SecureIT Systems', 'Atlas Business Services'], `The proposal is from ${v.supplier}.`),
      q('detail', 'What is the price?', v.price, ['$28 per box', '$210 per chair', '$4,500 per month', '$12,000 per year'], `The proposed price is ${v.price}.`),
      q('detail', 'When will delivery or onboarding happen?', v.delivery, ['within three working days', 'within two weeks', 'within ten days', 'within one month'], `Delivery will be completed ${v.delivery}.`),
      q('detail', 'What warranty or guarantee is offered?', v.warranty, ['a full replacement for damaged goods', 'a five-year warranty', 'a 99.9% service guarantee', 'a money-back guarantee'], `The proposal includes ${v.warranty}.`),
      q('inference', 'What is the main advantage of this supplier?', v.advantage, ['a lower carbon footprint', 'certified ergonomic design', '24-hour monitoring', 'the lowest price in the market'], `The main advantage is ${v.advantage}.`),
    ],
  },
  {
    key: 'performance-review',
    level: 'B2',
    topic: 'HR',
    tags: ['performance', 'review'],
    title: (v) => `Performance review: ${v.employee}`,
    variants: [
      { employee: 'Daniel Kim', role: 'Sales Manager', strength: 'strong client relationships', improve: 'delegating routine tasks', goal: 'grow the key account portfolio by 15%', rating: 'exceeds expectations' },
      { employee: 'Aisha Rahman', role: 'Software Engineer', strength: 'writing clean, reliable code', improve: 'presenting technical ideas to non-specialists', goal: 'lead the migration of two core services', rating: 'meets expectations' },
      { employee: 'Marco Silva', role: 'Operations Coordinator', strength: 'solving problems under pressure', improve: 'documenting processes more consistently', goal: 'reduce delivery errors by 20%', rating: 'exceeds expectations' },
    ],
    text: (v) =>
      `Performance review summary: ${v.employee}, ${v.role}\n\n${v.employee} continues to demonstrate ${v.strength}. This has contributed to strong results over the past year.\n\nThe main area for development is ${v.improve}. We agreed on an action plan and a goal to ${v.goal} over the next twelve months.\n\nOverall, ${v.employee} is rated as ${v.rating}. The next review will take place in six months.`,
    questions: (v) => [
      q('detail', 'What is the employee’s role?', v.role, ['Sales Manager', 'Software Engineer', 'Operations Coordinator', 'HR Business Partner'], `The employee is a ${v.role}.`),
      q('detail', 'What is the employee’s main strength?', v.strength, ['strong client relationships', 'writing clean, reliable code', 'solving problems under pressure', 'presenting to senior leaders'], `The strength is ${v.strength}.`),
      q('detail', 'What is the area for improvement?', v.improve, ['delegating routine tasks', 'presenting technical ideas to non-specialists', 'documenting processes more consistently', 'managing the budget'], `The improvement area is ${v.improve}.`),
      q('detail', 'What goal was agreed?', v.goal, ['grow the key account portfolio by 15%', 'lead the migration of two core services', 'reduce delivery errors by 20%', 'hire three new team members'], `The agreed goal is to ${v.goal}.`),
      q('detail', 'What is the overall rating?', v.rating, ['exceeds expectations', 'meets expectations', 'needs improvement', 'outstanding'], `The overall rating is ${v.rating}.`),
    ],
  },
  {
    key: 'market-research',
    level: 'B2',
    topic: 'marketing',
    tags: ['research', 'market'],
    title: (v) => `Market research: ${v.market}`,
    variants: [
      { market: 'the UK home-office furniture market', sample: '1,200 consumers', finding: 'price is the most important factor', competitor: 'WorkSpace Direct', recommendation: 'launch a mid-priced range' },
      { market: 'the German small-business software market', sample: '850 decision-makers', finding: 'integration with existing tools is critical', competitor: 'BüroSoft', recommendation: 'develop an open API' },
      { market: 'the Canadian online training market', sample: '2,000 HR professionals', finding: 'short courses are preferred to long programmes', competitor: 'LearnNorth', recommendation: 'offer modular courses' },
    ],
    text: (v) =>
      `Market research summary: ${v.market}\n\nWe surveyed ${v.sample} in the target segment. The key finding is that ${v.finding}. The strongest competitor is ${v.competitor}, which has a 24% market share.\n\nBased on these results, we recommend that the company ${v.recommendation}. This would allow us to differentiate our offer and address the most important customer priorities.\n\nA full report with detailed charts is available on the shared drive.`,
    questions: (v) => [
      q('detail', 'Which market was researched?', v.market, ['the UK home-office furniture market', 'the German small-business software market', 'the Canadian online training market', 'the US retail banking market'], `The research covers ${v.market}.`),
      q('detail', 'How many people were surveyed?', v.sample, ['850 decision-makers', '1,200 consumers', '2,000 HR professionals', '3,500 customers'], `The survey included ${v.sample}.`),
      q('detail', 'What is the key finding?', v.finding, ['price is the most important factor', 'integration with existing tools is critical', 'short courses are preferred to long programmes', 'customer service is the main differentiator'], `The key finding is that ${v.finding}.`),
      q('detail', 'Who is the strongest competitor?', v.competitor, ['WorkSpace Direct', 'BüroSoft', 'LearnNorth', 'Atlas Learning'], `The strongest competitor is ${v.competitor}.`),
      q('detail', 'What is the recommendation?', v.recommendation, ['launch a mid-priced range', 'develop an open API', 'offer modular courses', 'increase advertising spending'], `The recommendation is to ${v.recommendation}.`),
    ],
  },
  {
    key: 'customer-survey',
    level: 'B2',
    topic: 'customers',
    tags: ['survey', 'feedback'],
    title: (v) => `Customer survey: ${v.topic}`,
    variants: [
      { topic: 'the online banking service', satisfaction: '78%', complaint: 'slow response to support requests', best: 'the mobile app', action: 'hire more support staff', sample: '4,500 customers' },
      { topic: 'the home delivery service', satisfaction: '64%', complaint: 'deliveries arriving later than promised', best: 'the tracking feature', action: 'change the delivery partner', sample: '3,200 customers' },
      { topic: 'the office cleaning contract', satisfaction: '85%', complaint: 'inconsistent cleaning on Fridays', best: 'the friendly cleaning team', action: 'introduce a Friday inspection', sample: '900 employees' },
    ],
    text: (v) =>
      `Customer survey results: ${v.topic}\n\nWe received responses from ${v.sample}. Overall satisfaction is ${v.satisfaction}. The most common complaint is ${v.complaint}.\n\nCustomers identified ${v.best} as the best part of the service. As a result of the survey, we will ${v.action} over the next quarter.\n\nWe will repeat the survey in six months to measure progress.`,
    questions: (v) => [
      q('detail', 'What is the overall satisfaction rate?', v.satisfaction, ['64%', '78%', '85%', '92%'], `Satisfaction is ${v.satisfaction}.`),
      q('detail', 'What is the most common complaint?', v.complaint, ['slow response to support requests', 'deliveries arriving later than promised', 'inconsistent cleaning on Fridays', 'the high cost of the service'], `The complaint is ${v.complaint}.`),
      q('detail', 'What do customers like best?', v.best, ['the mobile app', 'the tracking feature', 'the friendly cleaning team', 'the low prices'], `Customers like ${v.best} best.`),
      q('detail', 'What action will the company take?', v.action, ['hire more support staff', 'change the delivery partner', 'introduce a Friday inspection', 'lower the service price'], `The company will ${v.action}.`),
      q('detail', 'How many responses were received?', v.sample, ['900 employees', '3,200 customers', '4,500 customers', '5,000 customers'], `The survey received ${v.sample}.`),
    ],
  },
  {
    key: 'sustainability-report',
    level: 'C1',
    topic: 'sustainability',
    tags: ['ESG', 'report'],
    title: (v) => `Sustainability report: ${v.company}`,
    variants: [
      { company: 'Hartley Group', reduction: '32%', renewable: '61%', target: 'net zero by 2040', investment: '$18 million', challenge: 'decarbonizing the supply chain' },
      { company: 'Northwind Logistics', reduction: '27%', renewable: '48%', target: 'net zero by 2035', investment: '$42 million', challenge: 'replacing the diesel fleet' },
      { company: 'Lumen Retail', reduction: '19%', renewable: '73%', target: 'net zero by 2045', investment: '$9 million', challenge: 'reducing packaging waste' },
    ],
    text: (v) =>
      `${v.company} has reduced its operational emissions by ${v.reduction} since 2019, according to its latest sustainability report. Renewable sources now account for ${v.renewable} of the company’s electricity use.\n\nThe company has committed to reaching ${v.target} and plans to invest ${v.investment} in low-carbon technology over the next five years. However, the report acknowledges that ${v.challenge} remains the most difficult challenge.\n\n“We have made genuine progress, but the next phase will require closer collaboration with suppliers and customers,” said the sustainability director.`,
    questions: (v) => [
      q('detail', 'By how much have operational emissions been reduced?', v.reduction, ['19%', '27%', '32%', '45%'], `The report says emissions fell by ${v.reduction}.`),
      q('detail', 'What share of electricity comes from renewable sources?', v.renewable, ['48%', '61%', '73%', '85%'], `Renewable sources account for ${v.renewable}.`),
      q('detail', 'What is the net-zero target year?', v.target, ['net zero by 2035', 'net zero by 2040', 'net zero by 2045', 'net zero by 2050'], `The target is ${v.target}.`),
      q('detail', 'How much will the company invest in low-carbon technology?', v.investment, ['$9 million', '$18 million', '$42 million', '$60 million'], `The planned investment is ${v.investment}.`),
      q('inference', 'What does the report identify as the main challenge?', v.challenge, ['decarbonizing the supply chain', 'replacing the diesel fleet', 'reducing packaging waste', 'training employees'], `The report says ${v.challenge} remains the most difficult challenge.`),
    ],
  },
  {
    key: 'contract-renewal',
    level: 'C1',
    topic: 'legal',
    tags: ['contract', 'renewal'],
    title: (v) => `Contract renewal: ${v.contract}`,
    variants: [
      { contract: 'the IT support agreement', expiry: '31 December', term: 'a further 24 months', change: 'a 4% price increase', deadline: '30 November', consequence: 'the service will end on 31 December' },
      { contract: 'the office lease', expiry: '31 March', term: 'a further five years', change: 'a rent review in year three', deadline: '28 February', consequence: 'the lease will not be renewed' },
      { contract: 'the logistics services contract', expiry: '30 September', term: 'a further 12 months', change: 'new service-level targets', deadline: '31 August', consequence: 'services will be re-tendered' },
    ],
    text: (v) =>
      `Dear Partner,\n\nYour ${v.contract} is due to expire on ${v.expiry}. We would like to offer a renewal for ${v.term}. The renewal includes ${v.change}.\n\nTo accept this offer, please confirm by ${v.deadline}. If we do not receive confirmation by that date, ${v.consequence}.\n\nWe value our working relationship and are happy to arrange a call to discuss the terms. Please contact your account manager if you have any questions.`,
    questions: (v) => [
      q('detail', 'When does the current contract expire?', v.expiry, ['31 March', '30 September', '31 December', '30 November'], `The contract expires on ${v.expiry}.`),
      q('detail', 'How long is the proposed renewal?', v.term, ['a further 12 months', 'a further 24 months', 'a further five years', 'a further three years'], `The renewal is for ${v.term}.`),
      q('detail', 'What change does the renewal include?', v.change, ['a 4% price increase', 'a rent review in year three', 'new service-level targets', 'a reduction in the service scope'], `The renewal includes ${v.change}.`),
      q('detail', 'What is the deadline for confirmation?', v.deadline, ['28 February', '31 August', '30 November', '31 December'], `Confirmation is needed by ${v.deadline}.`),
      q('inference', 'What happens if the partner does not confirm by the deadline?', v.consequence, ['the service will end on 31 December', 'the lease will not be renewed', 'services will be re-tendered', 'the price will increase by 10%'], `The letter says that ${v.consequence}.`),
    ],
  },
]

export function buildReading() {
  const passages = []
  const questions = []
  let passageIndex = 0
  let questionIndex = 0
  for (const scenario of PASSAGES) {
    for (const [variantIndex, variant] of scenario.variants.entries()) {
      passageIndex += 1
      const passageId = `reading-passage-${pad(passageIndex)}`
      const text = scenario.text(variant)
      const sourceInfo = sourceFor(passageIndex)
      passages.push({
        id: passageId,
        title: scenario.title(variant),
        text,
        level: scenario.level,
        difficulty: DIFFICULTY[scenario.level],
        topic: scenario.topic,
        tags: [...scenario.tags],
        ...sourceInfo,
      })
      for (const item of focusFor(scenario.key, variantIndex)) {
        questionIndex += 1
        questions.push(
          makeQuestion({
            id: `reading-${pad(questionIndex)}`,
            section: 'reading',
            type: item.type,
            level: scenario.level,
            topic: scenario.topic,
            tags: [...scenario.tags, item.type],
            stem: item.stem,
            correct: item.correct,
            distractors: item.distractors,
            explanation: item.explanation,
            passageId,
            ...sourceFor(questionIndex),
          }),
        )
      }
    }
  }
  return { passages, questions }
}

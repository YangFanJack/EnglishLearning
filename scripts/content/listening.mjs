import { DIFFICULTY, makeQuestion, pad, sourceFor } from './shared.mjs'
import { LISTENING_FOCUS } from './listening-focus.mjs'

const TYPE_LABELS = {
  detail: '细节理解',
  gist: '主旨概括',
  inference: '推断判断',
  purpose: '交际目的',
}

const DETAIL_WRAPPERS = [
  (stem) => stem,
  (stem) => `According to the audio, ${stem.charAt(0).toLowerCase()}${stem.slice(1)}`,
  (stem) => `In the recording, ${stem.charAt(0).toLowerCase()}${stem.slice(1)}`,
]

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

const SCENARIOS = [
  {
    key: 'office-directions',
    level: 'A1',
    topic: 'office',
    tags: ['directions', 'workplace'],
    title: (v) => `Finding ${v.room}`,
    variants: [
      { room: 'Room 3', floor: 'second', action: 'turn left' },
      { room: 'Room 5', floor: 'third', action: 'turn right' },
      { room: 'Room 12', floor: 'first', action: 'go straight' },
      { room: 'Room 8', floor: 'fourth', action: 'take the lift' },
      { room: 'Room 2', floor: 'fifth', action: 'turn left at the stairs' },
    ],
    turns: (v) => [
      { speaker: 'Visitor', text: 'Good morning. I have a meeting with Ms. Chen.' },
      { speaker: 'Receptionist', text: `The meeting is in ${v.room} on the ${v.floor} floor. Go straight and ${v.action}.` },
      { speaker: 'Visitor', text: 'Thank you very much.' },
    ],
    questions: (v) => [
      q('detail', 'Which room is the meeting in?', v.room, ['Room 3', 'Room 5', 'Room 8', 'Room 12'], `The receptionist says the meeting is in ${v.room}.`),
      q('detail', 'Which floor is the meeting room on?', `The ${v.floor} floor`, ['The first floor', 'The second floor', 'The third floor', 'The fourth floor'], `The room is on the ${v.floor} floor.`),
      q('detail', 'What should the visitor do?', v.action, ['turn left', 'turn right', 'go straight', 'take the lift', 'turn left at the stairs'], `The receptionist tells the visitor to ${v.action}.`),
    ],
  },
  {
    key: 'coffee-order',
    level: 'A1',
    topic: 'food-drink',
    tags: ['ordering', 'numbers'],
    title: (v) => `Coffee order: ${v.drink}`,
    variants: [
      { drink: 'latte', size: 'medium', price: '$4.00', place: 'takeaway' },
      { drink: 'americano', size: 'small', price: '$3.50', place: 'eat in' },
      { drink: 'cappuccino', size: 'large', price: '$4.50', place: 'takeaway' },
      { drink: 'green tea', size: 'medium', price: '$3.00', place: 'eat in' },
      { drink: 'hot chocolate', size: 'large', price: '$5.00', place: 'takeaway' },
    ],
    turns: (v) => [
      { speaker: 'Barista', text: 'Good morning. What can I get you?' },
      { speaker: 'Customer', text: `A ${v.size} ${v.drink}, please. ${v.place === 'takeaway' ? 'To take away.' : 'To eat in.'}` },
      { speaker: 'Barista', text: `That's ${v.price}. Anything else?` },
      { speaker: 'Customer', text: 'No, thank you.' },
    ],
    questions: (v) => [
      q('detail', 'What did the customer order?', v.drink, ['latte', 'americano', 'cappuccino', 'green tea', 'hot chocolate'], `The customer orders a ${v.drink}.`),
      q('detail', 'What size did the customer choose?', v.size, ['small', 'medium', 'large', 'extra large'], `The customer asks for a ${v.size} drink.`),
      q('detail', 'How much does the drink cost?', v.price, ['$3.00', '$3.50', '$4.00', '$4.50', '$5.00'], `The barista says the price is ${v.price}.`),
    ],
  },
  {
    key: 'phone-message',
    level: 'A1',
    topic: 'communication',
    tags: ['phone', 'messages'],
    title: (v) => `Message from ${v.caller}`,
    variants: [
      { caller: 'Mr. Lee', reason: 'the contract', callback: 'before 5 p.m.', number: '0207 555 0182' },
      { caller: 'Ms. Patel', reason: 'the invoice', callback: 'after 2 p.m.', number: '0161 555 0247' },
      { caller: 'Tom', reason: 'the delivery', callback: 'tomorrow morning', number: '0207 555 0391' },
      { caller: 'Anna', reason: 'the meeting', callback: 'before noon', number: '0113 555 0156' },
      { caller: 'Mr. Brown', reason: 'the price list', callback: 'after lunch', number: '0121 555 0734' },
    ],
    turns: (v) => [
      { speaker: 'Receptionist', text: 'Good morning, Hartley and Company.' },
      { speaker: v.caller, text: `Hello, this is ${v.caller}. Could you ask Daniel to call me about ${v.reason}? My number is ${v.number}.` },
      { speaker: 'Receptionist', text: `Of course. When is a good time to call?` },
      { speaker: v.caller, text: `${v.callback}. Thank you.` },
    ],
    questions: (v) => [
      q('detail', 'Who left the message?', v.caller, ['Mr. Lee', 'Ms. Patel', 'Tom', 'Anna', 'Mr. Brown'], `${v.caller} says their name at the start of the message.`),
      q('detail', 'What is the message about?', v.reason, ['the contract', 'the invoice', 'the delivery', 'the meeting', 'the price list'], `${v.caller} asks Daniel to call about ${v.reason}.`),
      q('detail', 'When should Daniel call back?', v.callback, ['before 5 p.m.', 'after 2 p.m.', 'tomorrow morning', 'before noon', 'after lunch'], `${v.caller} says to call ${v.callback}.`),
    ],
  },
  {
    key: 'meeting-change',
    level: 'A2',
    topic: 'meetings',
    tags: ['scheduling', 'change'],
    title: (v) => `Meeting moved to ${v.newTime}`,
    variants: [
      { day: 'Tuesday', oldTime: '10 a.m.', newTime: '2 p.m.', reason: 'the client is delayed', room: 'Room 4' },
      { day: 'Wednesday', oldTime: '9 a.m.', newTime: '11 a.m.', reason: 'the manager is travelling', room: 'the boardroom' },
      { day: 'Thursday', oldTime: '3 p.m.', newTime: '4:30 p.m.', reason: 'the report is not ready', room: 'Room 7' },
      { day: 'Monday', oldTime: '1 p.m.', newTime: '3 p.m.', reason: 'a supplier is visiting', room: 'the training room' },
      { day: 'Friday', oldTime: '11 a.m.', newTime: '9:30 a.m.', reason: 'the office is closing early', room: 'Room 2' },
    ],
    turns: (v) => [
      { speaker: 'Elena', text: `Have you heard? The ${v.day} meeting has moved from ${v.oldTime} to ${v.newTime}.` },
      { speaker: 'Mark', text: `Why the change?` },
      { speaker: 'Elena', text: `Because ${v.reason}. We will meet in ${v.room}.` },
      { speaker: 'Mark', text: 'Thanks for letting me know.' },
    ],
    questions: (v) => [
      q('detail', 'When is the meeting now?', v.newTime, ['9 a.m.', '9:30 a.m.', '10 a.m.', '11 a.m.', '1 p.m.', '2 p.m.', '3 p.m.', '4:30 p.m.'], `The meeting is now at ${v.newTime}.`),
      q('detail', 'Why was the meeting changed?', v.reason, ['the client is delayed', 'the manager is travelling', 'the report is not ready', 'a supplier is visiting', 'the office is closing early'], `Elena says the change is because ${v.reason}.`),
      q('detail', 'Where will the meeting be held?', v.room, ['Room 2', 'Room 4', 'Room 7', 'the boardroom', 'the training room'], `The meeting will be in ${v.room}.`),
    ],
  },
  {
    key: 'hotel-booking',
    level: 'A2',
    topic: 'travel',
    tags: ['hotel', 'booking'],
    title: (v) => `Hotel booking for ${v.guest}`,
    variants: [
      { guest: 'Ms. Garcia', nights: 'two nights', room: 'a double room', price: '$120 per night', breakfast: 'breakfast is included' },
      { guest: 'Mr. Wong', nights: 'three nights', room: 'a single room', price: '$95 per night', breakfast: 'breakfast is not included' },
      { guest: 'Dr. Meyer', nights: 'one night', room: 'a suite', price: '$210 per night', breakfast: 'breakfast is included' },
      { guest: 'Ms. Rossi', nights: 'four nights', room: 'a twin room', price: '$130 per night', breakfast: 'breakfast is not included' },
      { guest: 'Mr. Khan', nights: 'five nights', room: 'a business room', price: '$150 per night', breakfast: 'breakfast is included' },
    ],
    turns: (v) => [
      { speaker: 'Receptionist', text: 'Good evening. How can I help you?' },
      { speaker: v.guest, text: `I have a reservation under ${v.guest} for ${v.nights}.` },
      { speaker: 'Receptionist', text: `Yes, ${v.room} at ${v.price}. ${v.breakfast}.` },
      { speaker: v.guest, text: 'Great, thank you.' },
    ],
    questions: (v) => [
      q('detail', 'How many nights is the guest staying?', v.nights, ['one night', 'two nights', 'three nights', 'four nights', 'five nights'], `The reservation is for ${v.nights}.`),
      q('detail', 'What type of room did the guest book?', v.room, ['a single room', 'a double room', 'a twin room', 'a suite', 'a business room'], `The receptionist confirms ${v.room}.`),
      qo(
        'detail',
        'Does the room price include breakfast?',
        v.breakfast === 'breakfast is included' ? 'Yes, breakfast is included' : 'No, breakfast is not included',
        [
          v.breakfast === 'breakfast is included' ? 'No, breakfast is not included' : 'Yes, breakfast is included',
          'Only on weekdays',
          'Only for business rooms',
        ],
        `The receptionist says ${v.breakfast}.`,
      ),
    ],
  },
  {
    key: 'train-delay',
    level: 'A2',
    topic: 'travel',
    tags: ['transport', 'announcement'],
    title: (v) => `Train ${v.train} delay`,
    variants: [
      { train: 'the 8:15', destination: 'Manchester', delay: '20 minutes', platform: 'platform 6', reason: 'a signal failure' },
      { train: 'the 9:40', destination: 'Bristol', delay: '35 minutes', platform: 'platform 2', reason: 'bad weather' },
      { train: 'the 10:05', destination: 'Leeds', delay: '15 minutes', platform: 'platform 9', reason: 'a late arrival' },
      { train: 'the 11:30', destination: 'Cardiff', delay: '45 minutes', platform: 'platform 4', reason: 'engineering work' },
      { train: 'the 12:20', destination: 'Edinburgh', delay: '25 minutes', platform: 'platform 11', reason: 'a broken train' },
    ],
    turns: (v) => [
      { speaker: 'Announcement', text: `Good morning. ${v.train} service to ${v.destination} is delayed by ${v.delay} because of ${v.reason}.` },
      { speaker: 'Announcement', text: `The train will now leave from ${v.platform}. We apologize for the delay.` },
    ],
    questions: (v) => [
      q('detail', 'Which platform will the train leave from?', v.platform, ['platform 2', 'platform 4', 'platform 6', 'platform 9', 'platform 11'], `The announcement says ${v.platform}.`),
      q('detail', 'How long is the delay?', v.delay, ['15 minutes', '20 minutes', '25 minutes', '35 minutes', '45 minutes'], `The train is delayed by ${v.delay}.`),
      q('detail', 'What is the reason for the delay?', v.reason, ['a signal failure', 'bad weather', 'a late arrival', 'engineering work', 'a broken train'], `The announcement gives ${v.reason} as the reason.`),
    ],
  },
  {
    key: 'office-supplies',
    level: 'A2',
    topic: 'office',
    tags: ['ordering', 'supplies'],
    title: (v) => `Ordering ${v.item}`,
    variants: [
      { item: 'printer paper', quantity: 'ten boxes', arrival: 'Wednesday', budget: '$200', approver: 'the office manager' },
      { item: 'blue pens', quantity: 'fifty packs', arrival: 'Thursday', budget: '$150', approver: 'the finance team' },
      { item: 'desk lamps', quantity: 'twelve lamps', arrival: 'Monday', budget: '$360', approver: 'the department head' },
      { item: 'whiteboard markers', quantity: 'thirty packs', arrival: 'Friday', budget: '$90', approver: 'the training manager' },
      { item: 'filing folders', quantity: 'one hundred folders', arrival: 'Tuesday', budget: '$120', approver: 'the office manager' },
    ],
    turns: (v) => [
      { speaker: 'Priya', text: `We need to order ${v.quantity} of ${v.item}. The cost is about ${v.budget}.` },
      { speaker: 'Sam', text: `Who will approve it?` },
      { speaker: 'Priya', text: `${v.approver}. If we order today, it should arrive by ${v.arrival}.` },
    ],
    questions: (v) => [
      q('detail', 'What did they decide to order?', v.item, ['printer paper', 'blue pens', 'desk lamps', 'whiteboard markers', 'filing folders'], `They order ${v.item}.`),
      q('detail', 'How many do they need?', v.quantity, ['ten boxes', 'fifty packs', 'twelve lamps', 'thirty packs', 'one hundred folders'], `Priya says they need ${v.quantity}.`),
      q('detail', 'When should the order arrive?', v.arrival, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], `The order should arrive by ${v.arrival}.`),
    ],
  },
  {
    key: 'lunch-reservation',
    level: 'A2',
    topic: 'food-drink',
    tags: ['restaurant', 'reservation'],
    title: (v) => `Lunch for ${v.people}`,
    variants: [
      { name: 'Mr. Adams', people: 'four people', time: '12:30', request: 'a table by the window', phone: '0207 555 0123' },
      { name: 'Ms. Lin', people: 'six people', time: '1 p.m.', request: 'a vegetarian menu', phone: '0161 555 0456' },
      { name: 'Mr. Davis', people: 'two people', time: '11:45', request: 'a quiet table', phone: '0113 555 0789' },
      { name: 'Ms. Clark', people: 'eight people', time: '12 noon', request: 'a private room', phone: '0121 555 0321' },
      { name: 'Mr. Evans', people: 'three people', time: '1:30 p.m.', request: 'a high chair for a child', phone: '0207 555 0654' },
    ],
    turns: (v) => [
      { speaker: 'Restaurant', text: 'Good morning, The Riverside Restaurant.' },
      { speaker: v.name, text: `I would like to book a table for ${v.people} at ${v.time} today.` },
      { speaker: 'Restaurant', text: `Certainly. Any special request?` },
      { speaker: v.name, text: `Yes, we would like ${v.request}. My name is ${v.name}.` },
    ],
    questions: (v) => [
      q('detail', 'How many people is the reservation for?', v.people, ['two people', 'three people', 'four people', 'six people', 'eight people'], `The reservation is for ${v.people}.`),
      q('detail', 'What time is the lunch reservation?', v.time, ['11:45', '12 noon', '12:30', '1 p.m.', '1:30 p.m.'], `The table is booked for ${v.time}.`),
      q('detail', 'What special request does the caller make?', v.request, ['a table by the window', 'a vegetarian menu', 'a quiet table', 'a private room', 'a high chair for a child'], `The caller asks for ${v.request}.`),
    ],
  },
  {
    key: 'project-update',
    level: 'B1',
    topic: 'projects',
    tags: ['update', 'risk'],
    title: (v) => `Project update: ${v.project}`,
    variants: [
      { project: 'the website redesign', milestone: 'the design review', deadline: 'next Friday', risk: 'the content is late', owner: 'the marketing team' },
      { project: 'the new CRM system', milestone: 'the data migration', deadline: 'the end of the month', risk: 'the vendor is behind schedule', owner: 'the IT team' },
      { project: 'the office relocation', milestone: 'the lease signing', deadline: 'March 15', risk: 'the legal review is delayed', owner: 'the facilities team' },
      { project: 'the product launch', milestone: 'the pricing approval', deadline: 'April 10', risk: 'the budget is not confirmed', owner: 'the sales team' },
      { project: 'the training programme', milestone: 'the pilot session', deadline: 'next Wednesday', risk: 'the trainers are not available', owner: 'the HR team' },
    ],
    turns: (v) => [
      { speaker: 'Project lead', text: `Here is the update on ${v.project}. We have reached ${v.milestone}.` },
      { speaker: 'Manager', text: `What is the deadline for that?` },
      { speaker: 'Project lead', text: `${v.deadline}. The main risk is that ${v.risk}. ${v.owner} is responsible for the next step.` },
    ],
    questions: (v) => [
      q('detail', 'What milestone has the project reached?', v.milestone, ['the design review', 'the data migration', 'the lease signing', 'the pricing approval', 'the pilot session'], `The team has reached ${v.milestone}.`),
      q('detail', 'What is the main risk?', v.risk, ['the content is late', 'the vendor is behind schedule', 'the legal review is delayed', 'the budget is not confirmed', 'the trainers are not available'], `The project lead says the main risk is that ${v.risk}.`),
      q('detail', 'Which team is responsible for the next step?', v.owner, ['the marketing team', 'the IT team', 'the facilities team', 'the sales team', 'the HR team'], `${v.owner} is responsible.`),
    ],
  },
  {
    key: 'job-interview',
    level: 'B1',
    topic: 'recruitment',
    tags: ['interview', 'career'],
    title: (v) => `Interview for ${v.role}`,
    variants: [
      { role: 'the sales manager position', years: 'five years', strength: 'building client relationships', start: 'next month', expectation: '$65,000' },
      { role: 'the marketing specialist role', years: 'three years', strength: 'writing campaign copy', start: 'in two weeks', expectation: '$48,000' },
      { role: 'the finance analyst job', years: 'four years', strength: 'financial modelling', start: 'after the notice period', expectation: '$58,000' },
      { role: 'the HR coordinator position', years: 'two years', strength: 'organizing training', start: 'in June', expectation: '$42,000' },
      { role: 'the operations director role', years: 'ten years', strength: 'leading large teams', start: 'the first of September', expectation: '$95,000' },
    ],
    turns: (v) => [
      { speaker: 'Interviewer', text: `Why are you interested in ${v.role}?` },
      { speaker: 'Candidate', text: `I have ${v.years} of experience, and my main strength is ${v.strength}.` },
      { speaker: 'Interviewer', text: 'When could you start?' },
      { speaker: 'Candidate', text: `${v.start}. My salary expectation is ${v.expectation}.` },
    ],
    questions: (v) => [
      q('detail', 'Which position is the candidate applying for?', v.role, ['the sales manager position', 'the marketing specialist role', 'the finance analyst job', 'the HR coordinator position', 'the operations director role'], `The interview is for ${v.role}.`),
      q('detail', 'What is the candidate’s main strength?', v.strength, ['building client relationships', 'writing campaign copy', 'financial modelling', 'organizing training', 'leading large teams'], `The candidate says their main strength is ${v.strength}.`),
      q('detail', 'When can the candidate start?', v.start, ['next month', 'in two weeks', 'after the notice period', 'in June', 'the first of September'], `The candidate can start ${v.start}.`),
    ],
  },
  {
    key: 'customer-complaint',
    level: 'B1',
    topic: 'customers',
    tags: ['complaint', 'service'],
    title: (v) => `Complaint about ${v.product}`,
    variants: [
      { product: 'a coffee machine', issue: 'it stopped working after two days', solution: 'a full refund', timeline: 'within five working days' },
      { product: 'a laptop bag', issue: 'the strap broke', solution: 'a replacement bag', timeline: 'by the end of the week' },
      { product: 'a desk chair', issue: 'the wheels are damaged', solution: 'a free repair', timeline: 'next Tuesday' },
      { product: 'a printer', issue: 'it keeps jamming', solution: 'a new printer', timeline: 'within three days' },
      { product: 'a monitor', issue: 'the screen has dead pixels', solution: 'a store credit', timeline: 'after the inspection' },
    ],
    turns: (v) => [
      { speaker: 'Customer', text: `I bought ${v.product} last week, but ${v.issue}.` },
      { speaker: 'Agent', text: 'I am sorry to hear that. We can offer you ' + v.solution + '.' },
      { speaker: 'Customer', text: 'How long will that take?' },
      { speaker: 'Agent', text: `${v.timeline}.` },
    ],
    questions: (v) => [
      q('detail', 'What product is the complaint about?', v.product, ['a coffee machine', 'a laptop bag', 'a desk chair', 'a printer', 'a monitor'], `The customer complains about ${v.product}.`),
      q('detail', 'What is the problem?', v.issue, ['it stopped working after two days', 'the strap broke', 'the wheels are damaged', 'it keeps jamming', 'the screen has dead pixels'], `The customer says ${v.issue}.`),
      q('detail', 'What solution is offered?', v.solution, ['a full refund', 'a replacement bag', 'a free repair', 'a new printer', 'a store credit'], `The agent offers ${v.solution}.`),
    ],
  },
  {
    key: 'invoice-payment',
    level: 'B1',
    topic: 'finance',
    tags: ['invoice', 'payment'],
    title: (v) => `Invoice ${v.invoice}`,
    variants: [
      { invoice: 'INV-2041', amount: '$3,200', due: 'last Friday', issue: 'the purchase order number is missing', action: 'send a corrected invoice' },
      { invoice: 'INV-3187', amount: '$1,850', due: 'tomorrow', issue: 'the bank details have changed', action: 'confirm the new bank details' },
      { invoice: 'INV-4420', amount: '$7,600', due: 'in two weeks', issue: 'the discount was not applied', action: 'issue a credit note' },
      { invoice: 'INV-5591', amount: '$940', due: 'yesterday', issue: 'the invoice was sent to the wrong department', action: 'resend it to finance' },
      { invoice: 'INV-6034', amount: '$12,500', due: 'at the end of the month', issue: 'the payment is waiting for approval', action: 'contact the approver' },
    ],
    turns: (v) => [
      { speaker: 'Supplier', text: `We are chasing invoice ${v.invoice} for ${v.amount}. It was due ${v.due}.` },
      { speaker: 'Buyer', text: `The problem is that ${v.issue}.` },
      { speaker: 'Supplier', text: 'What should we do?' },
      { speaker: 'Buyer', text: `Please ${v.action}.` },
    ],
    questions: (v) => [
      q('detail', 'How much is the invoice for?', v.amount, ['$940', '$1,850', '$3,200', '$7,600', '$12,500'], `The invoice is for ${v.amount}.`),
      q('detail', 'Why has the invoice not been paid?', v.issue, ['the purchase order number is missing', 'the bank details have changed', 'the discount was not applied', 'the invoice was sent to the wrong department', 'the payment is waiting for approval'], `The buyer says ${v.issue}.`),
      q('detail', 'What should the supplier do next?', v.action, ['send a corrected invoice', 'confirm the new bank details', 'issue a credit note', 'resend it to finance', 'contact the approver'], `The buyer asks the supplier to ${v.action}.`),
    ],
  },
  {
    key: 'conference-call',
    level: 'B1',
    topic: 'meetings',
    tags: ['conference-call', 'international'],
    title: (v) => `Conference call with ${v.attendee}`,
    variants: [
      { time: '3 p.m. London time', attendee: 'the Singapore team', agenda: 'the regional sales forecast', issue: 'the video link is unstable', action: 'share the slides by email' },
      { time: '9 a.m. New York time', attendee: 'the Berlin office', agenda: 'the new compliance policy', issue: 'one participant cannot hear', action: 'dial in by phone' },
      { time: '2 p.m. Dubai time', attendee: 'the Indian supplier', agenda: 'the delivery schedule', issue: 'the presentation will not load', action: 'send a PDF version' },
      { time: '11 a.m. Sydney time', attendee: 'the Tokyo partners', agenda: 'the product localization plan', issue: 'the connection keeps dropping', action: 'reschedule the call' },
      { time: '4 p.m. São Paulo time', attendee: 'the Madrid team', agenda: 'the quarterly budget review', issue: 'there is a background noise problem', action: 'mute all microphones' },
    ],
    turns: (v) => [
      { speaker: 'Host', text: `The conference call with ${v.attendee} is at ${v.time}. The main agenda item is ${v.agenda}.` },
      { speaker: 'Colleague', text: `We have a technical problem: ${v.issue}.` },
      { speaker: 'Host', text: `In that case, please ${v.action}.` },
    ],
    questions: (v) => [
      q('detail', 'What is the main agenda item?', v.agenda, ['the regional sales forecast', 'the new compliance policy', 'the delivery schedule', 'the product localization plan', 'the quarterly budget review'], `The main agenda item is ${v.agenda}.`),
      q('detail', 'Who is joining the call?', v.attendee, ['the Singapore team', 'the Berlin office', 'the Indian supplier', 'the Tokyo partners', 'the Madrid team'], `The call is with ${v.attendee}.`),
      q('detail', 'What technical problem do they have?', v.issue, ['the video link is unstable', 'one participant cannot hear', 'the presentation will not load', 'the connection keeps dropping', 'there is a background noise problem'], `They report that ${v.issue}.`),
    ],
  },
  {
    key: 'supplier-negotiation',
    level: 'B2',
    topic: 'negotiation',
    tags: ['supplier', 'pricing'],
    title: (v) => `Negotiating ${v.product}`,
    variants: [
      { product: 'the packaging contract', target: '$2.10 per unit', offered: '$2.35 per unit', discount: 'a 5% discount', term: 'payment within 30 days' },
      { product: 'the office furniture order', target: '$18,000', offered: '$19,500', discount: 'free delivery', term: 'delivery within six weeks' },
      { product: 'the software licence', target: '$12,000 a year', offered: '$14,000 a year', discount: 'a 10% discount', term: 'a three-year contract' },
      { product: 'the logistics service', target: '$0.85 per parcel', offered: '$0.95 per parcel', discount: 'a 3% volume discount', term: 'a monthly review' },
      { product: 'the raw materials order', target: '$45,000', offered: '$48,000', discount: 'a 7% discount', term: 'payment in two instalments' },
    ],
    turns: (v) => [
      { speaker: 'Buyer', text: `We would like to agree a price of ${v.target} for ${v.product}.` },
      { speaker: 'Supplier', text: `We can offer ${v.offered}, but we could consider ${v.discount}.` },
      { speaker: 'Buyer', text: `What about the payment terms?` },
      { speaker: 'Supplier', text: `We would need ${v.term}.` },
    ],
    questions: (v) => [
      q('detail', 'What is the buyer’s target price?', v.target, ['$2.10 per unit', '$18,000', '$12,000 a year', '$0.85 per parcel', '$45,000'], `The buyer asks for ${v.target}.`),
      q('detail', 'What discount does the supplier mention?', v.discount, ['a 5% discount', 'free delivery', 'a 10% discount', 'a 3% volume discount', 'a 7% discount'], `The supplier mentions ${v.discount}.`),
      q('detail', 'What payment or delivery term does the supplier require?', v.term, ['payment within 30 days', 'delivery within six weeks', 'a three-year contract', 'a monthly review', 'payment in two instalments'], `The supplier requires ${v.term}.`),
    ],
  },
  {
    key: 'product-launch',
    level: 'B2',
    topic: 'marketing',
    tags: ['launch', 'strategy'],
    title: (v) => `Launching ${v.product}`,
    variants: [
      { product: 'the new mobile app', date: 'May 12', market: 'small businesses in Germany', budget: '$80,000', risk: 'the app store approval is delayed' },
      { product: 'the premium coffee range', date: 'June 3', market: 'hotel chains in the UK', budget: '$45,000', risk: 'the packaging supplier is late' },
      { product: 'the online training platform', date: 'September 1', market: 'HR teams in Canada', budget: '$120,000', risk: 'the demo content is incomplete' },
      { product: 'the smart office sensor', date: 'October 15', market: 'facilities managers in Japan', budget: '$200,000', risk: 'the certification is not finished' },
      { product: 'the eco-friendly packaging line', date: 'November 20', market: 'food retailers in France', budget: '$150,000', risk: 'the raw material cost is rising' },
    ],
    turns: (v) => [
      { speaker: 'Marketing lead', text: `We plan to launch ${v.product} on ${v.date}.` },
      { speaker: 'Director', text: `Who is the target market?` },
      { speaker: 'Marketing lead', text: `${v.market}. The budget is ${v.budget}, but the main risk is that ${v.risk}.` },
    ],
    questions: (v) => [
      q('detail', 'When is the launch planned?', v.date, ['May 12', 'June 3', 'September 1', 'October 15', 'November 20'], `The launch is planned for ${v.date}.`),
      q('detail', 'What is the target market?', v.market, ['small businesses in Germany', 'hotel chains in the UK', 'HR teams in Canada', 'facilities managers in Japan', 'food retailers in France'], `The target market is ${v.market}.`),
      q('detail', 'What is the main risk?', v.risk, ['the app store approval is delayed', 'the packaging supplier is late', 'the demo content is incomplete', 'the certification is not finished', 'the raw material cost is rising'], `The main risk is that ${v.risk}.`),
    ],
  },
  {
    key: 'budget-review',
    level: 'B2',
    topic: 'finance',
    tags: ['budget', 'costs'],
    title: (v) => `Budget review: ${v.department}`,
    variants: [
      { department: 'the marketing department', overspend: '$24,000', cause: 'a larger advertising campaign', cut: 'travel and events', deadline: 'the end of the quarter' },
      { department: 'the IT department', overspend: '$38,000', cause: 'unexpected licence costs', cut: 'new hardware purchases', deadline: 'next month' },
      { department: 'the sales department', overspend: '$15,000', cause: 'higher commission payments', cut: 'entertainment expenses', deadline: 'the end of June' },
      { department: 'the HR department', overspend: '$9,000', cause: 'an additional training programme', cut: 'recruitment advertising', deadline: 'the end of the year' },
      { department: 'the operations department', overspend: '$52,000', cause: 'higher transport costs', cut: 'overtime', deadline: 'the next board meeting' },
    ],
    turns: (v) => [
      { speaker: 'Finance director', text: `${v.department} has overspent by ${v.overspend}.` },
      { speaker: 'Department head', text: `The main cause was ${v.cause}.` },
      { speaker: 'Finance director', text: `We need to cut ${v.cut} by ${v.deadline}.` },
    ],
    questions: (v) => [
      q('detail', 'Which department has overspent?', v.department, ['the marketing department', 'the IT department', 'the sales department', 'the HR department', 'the operations department'], `${v.department} has overspent.`),
      q('detail', 'How much is the overspend?', v.overspend, ['$9,000', '$15,000', '$24,000', '$38,000', '$52,000'], `The overspend is ${v.overspend}.`),
      q('detail', 'What will be cut?', v.cut, ['travel and events', 'new hardware purchases', 'entertainment expenses', 'recruitment advertising', 'overtime'], `They need to cut ${v.cut}.`),
    ],
  },
  {
    key: 'it-outage',
    level: 'B2',
    topic: 'technology',
    tags: ['IT', 'outage'],
    title: (v) => `${v.system} outage`,
    variants: [
      { system: 'the email system', time: '8:15 a.m.', cause: 'a failed server update', users: 'about 200 employees', fix: 'by 11 a.m.' },
      { system: 'the customer database', time: '10:30 p.m.', cause: 'a network configuration error', users: 'the entire sales team', fix: 'within two hours' },
      { system: 'the payment platform', time: '1:40 p.m.', cause: 'a security certificate issue', users: 'all online customers', fix: 'by the end of the day' },
      { system: 'the internal chat tool', time: '7:05 a.m.', cause: 'a storage capacity problem', users: 'staff in three offices', fix: 'after the next maintenance window' },
      { system: 'the reporting dashboard', time: '4:20 p.m.', cause: 'a corrupted data feed', users: 'the finance and operations teams', fix: 'tomorrow morning' },
    ],
    turns: (v) => [
      { speaker: 'IT support', text: `${v.system} went down at ${v.time}.` },
      { speaker: 'Manager', text: `What caused it, and who is affected?` },
      { speaker: 'IT support', text: `The cause was ${v.cause}. ${v.users} are affected. We expect to fix it ${v.fix}.` },
    ],
    questions: (v) => [
      q('detail', 'Which system failed?', v.system, ['the email system', 'the customer database', 'the payment platform', 'the internal chat tool', 'the reporting dashboard'], `${v.system} failed.`),
      q('detail', 'Who is affected?', v.users, ['about 200 employees', 'the entire sales team', 'all online customers', 'staff in three offices', 'the finance and operations teams'], `${v.users} are affected.`),
      q('detail', 'When do they expect to fix it?', v.fix, ['by 11 a.m.', 'within two hours', 'by the end of the day', 'after the next maintenance window', 'tomorrow morning'], `They expect to fix it ${v.fix}.`),
    ],
  },
  {
    key: 'merger-discussion',
    level: 'C1',
    topic: 'strategy',
    tags: ['merger', 'acquisition'],
    title: (v) => `Acquisition of ${v.target}`,
    variants: [
      { target: 'Nordic Analytics', value: '$240 million', synergy: 'shared data platforms', risk: 'regulatory approval', decision: 'at the October board meeting' },
      { target: 'Blue Harbour Logistics', value: '$180 million', synergy: 'a larger distribution network', risk: 'integration costs', decision: 'after due diligence' },
      { target: 'Vertex Health', value: '$520 million', synergy: 'access to new clinical research', risk: 'customer overlap', decision: 'in the first quarter' },
      { target: 'Lumen Retail Group', value: '$95 million', synergy: 'combined purchasing power', risk: 'staff retention', decision: 'by the end of November' },
      { target: 'Aster Energy', value: '$1.2 billion', synergy: 'renewable energy expertise', risk: 'political uncertainty', decision: 'at the next shareholder meeting' },
    ],
    turns: (v) => [
      { speaker: 'CEO', text: `We are considering the acquisition of ${v.target} for ${v.value}.` },
      { speaker: 'CFO', text: `What is the strategic rationale?` },
      { speaker: 'CEO', text: `The main synergy is ${v.synergy}. The key risk is ${v.risk}. We will decide ${v.decision}.` },
    ],
    questions: (v) => [
      q('detail', 'How much is the proposed deal worth?', v.value, ['$95 million', '$180 million', '$240 million', '$520 million', '$1.2 billion'], `The deal is valued at ${v.value}.`),
      q('detail', 'What is the main synergy?', v.synergy, ['shared data platforms', 'a larger distribution network', 'access to new clinical research', 'combined purchasing power', 'renewable energy expertise'], `The main synergy is ${v.synergy}.`),
      q('detail', 'What is the key risk?', v.risk, ['regulatory approval', 'integration costs', 'customer overlap', 'staff retention', 'political uncertainty'], `The key risk is ${v.risk}.`),
    ],
  },
  {
    key: 'compliance-audit',
    level: 'C1',
    topic: 'legal',
    tags: ['compliance', 'audit'],
    title: (v) => `Compliance finding: ${v.area}`,
    variants: [
      { area: 'data protection', finding: 'customer records were stored without consent', deadline: '30 days', penalty: 'a fine of up to $500,000', action: 'delete the affected records' },
      { area: 'health and safety', finding: 'fire exits were blocked in the warehouse', deadline: 'seven days', penalty: 'a temporary closure order', action: 'clear all emergency routes' },
      { area: 'financial reporting', finding: 'expenses were not properly documented', deadline: 'the next audit cycle', penalty: 'a qualified audit opinion', action: 'introduce a new approval process' },
      { area: 'employment law', finding: 'some staff had not received written contracts', deadline: '14 days', penalty: 'claims from affected employees', action: 'issue contracts immediately' },
      { area: 'environmental compliance', finding: 'waste was not separated correctly', deadline: '60 days', penalty: 'an environmental improvement notice', action: 'train the facilities team' },
    ],
    turns: (v) => [
      { speaker: 'Auditor', text: `The audit found an issue in ${v.area}: ${v.finding}.` },
      { speaker: 'Manager', text: `What are the consequences if we do not act?` },
      { speaker: 'Auditor', text: `We could face ${v.penalty}. You need to ${v.action} within ${v.deadline}.` },
    ],
    questions: (v) => [
      q('detail', 'What is the audit finding?', v.finding, ['customer records were stored without consent', 'fire exits were blocked in the warehouse', 'expenses were not properly documented', 'some staff had not received written contracts', 'waste was not separated correctly'], `The finding is that ${v.finding}.`),
      q('detail', 'What is the deadline for action?', v.deadline, ['seven days', '14 days', '30 days', '60 days', 'the next audit cycle'], `The deadline is ${v.deadline}.`),
      q('detail', 'What action is required?', v.action, ['delete the affected records', 'clear all emergency routes', 'introduce a new approval process', 'issue contracts immediately', 'train the facilities team'], `The manager must ${v.action}.`),
    ],
  },
  {
    key: 'strategic-planning',
    level: 'C1',
    topic: 'strategy',
    tags: ['investment', 'growth'],
    title: (v) => `Investment in ${v.market}`,
    variants: [
      { market: 'the Southeast Asian market', investment: '$30 million', return: '18% over five years', risk: 'currency volatility', timeline: 'a three-year rollout' },
      { market: 'the North American enterprise segment', investment: '$75 million', return: '22% over four years', risk: 'strong local competition', timeline: 'a two-year rollout' },
      { market: 'the Middle East logistics sector', investment: '$45 million', return: '16% over six years', risk: 'regulatory complexity', timeline: 'a four-year rollout' },
      { market: 'the European renewable energy sector', investment: '$120 million', return: '20% over seven years', risk: 'policy changes', timeline: 'a five-year rollout' },
      { market: 'the Latin American retail sector', investment: '$25 million', return: '15% over three years', risk: 'supply chain instability', timeline: 'an 18-month rollout' },
    ],
    turns: (v) => [
      { speaker: 'Strategy director', text: `We propose investing ${v.investment} in ${v.market}.` },
      { speaker: 'Board member', text: `What return do we expect, and what are the risks?` },
      { speaker: 'Strategy director', text: `We expect ${v.return}. The main risk is ${v.risk}. The plan is ${v.timeline}.` },
    ],
    questions: (v) => [
      q('detail', 'How much investment is proposed?', v.investment, ['$25 million', '$30 million', '$45 million', '$75 million', '$120 million'], `The proposal is to invest ${v.investment}.`),
      q('detail', 'What return is expected?', v.return, ['15% over three years', '16% over six years', '18% over five years', '20% over seven years', '22% over four years'], `The expected return is ${v.return}.`),
      q('detail', 'What is the main risk?', v.risk, ['currency volatility', 'strong local competition', 'regulatory complexity', 'policy changes', 'supply chain instability'], `The main risk is ${v.risk}.`),
    ],
  },
]

export function buildListening() {
  const sets = []
  const questions = []
  let index = 0
  for (const scenario of SCENARIOS) {
    for (const [variantIndex, variant] of scenario.variants.entries()) {
      const turns = scenario.turns(variant)
      const script = turns.map((turn) => `${turn.speaker}: ${turn.text}`).join('\n')
      for (const [questionIndex, detailItem] of scenario.questions(variant).entries()) {
        const focusItem = LISTENING_FOCUS[scenario.key][variantIndex % 3]
        const item =
          questionIndex === 2
            ? focusItem
            : { ...detailItem, stem: DETAIL_WRAPPERS[variantIndex % 3](detailItem.stem) }
        index += 1
        const setId = `listening-set-${pad(index)}`
        const questionId = `listening-${pad(index)}`
        questions.push(
          makeQuestion({
            id: questionId,
            section: 'listening',
            type: item.type,
            level: scenario.level,
            topic: scenario.topic,
            tags: [...scenario.tags, item.type],
            stem: item.stem,
            correct: item.correct,
            distractors: item.distractors,
            explanation: item.explanation,
            script,
            setId,
            ...sourceFor(index),
          }),
        )
        sets.push({
          id: setId,
          level: scenario.level,
          difficulty: DIFFICULTY[scenario.level],
          topic: scenario.topic,
          tags: [...scenario.tags, item.type],
          title: `${scenario.title(variant)} · ${TYPE_LABELS[item.type] ?? '听力理解'}`,
          script,
          turns,
        })
      }
    }
  }
  return { sets, questions }
}

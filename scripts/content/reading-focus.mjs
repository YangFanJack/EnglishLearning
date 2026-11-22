const f = (type, stem, correct, distractors, explanation) => ({ type, stem, correct, distractors, explanation })

const CONTEXT_LABELS = {
  'event-invitation': 'invitation message',
  'travel-itinerary': 'trip itinerary',
  'meeting-agenda': 'meeting email',
  'training-announcement': 'training notice',
  'conference-schedule': 'conference schedule',
  'project-status': 'project update',
  'complaint-response': 'response to a complaint',
  'job-offer': 'job offer',
  'invoice-reminder': 'payment reminder',
  'office-relocation': 'office move notice',
  'recruitment-ad': 'job advert',
  'it-maintenance': 'IT maintenance notice',
  'product-launch-pr': 'product announcement',
  'policy-update': 'policy notice',
  'supplier-proposal': 'supplier proposal',
  'performance-review': 'performance review',
  'market-research': 'research summary',
  'customer-survey': 'survey report',
  'sustainability-report': 'sustainability report',
  'contract-renewal': 'contract renewal letter',
}

const STEM_VARIANTS = {
  gist: [
    (stem, label) => `What is the main idea of the ${label}?`,
    (stem, label) => `Which summary best captures the ${label}?`,
    (stem, label) => `What is the central point of the ${label}?`,
  ],
  inference: [
    (stem, label) => `What can be inferred from the ${label}?`,
    (stem, label) => `What conclusion can be drawn about the ${label}?`,
    (stem, label) => `What is implied but not stated in the ${label}?`,
  ],
  vocabulary: [
    (stem, label) => `What does the highlighted word mean in the ${label}?`,
    (stem, label) => `Which meaning fits the word in the ${label}?`,
    (stem, label) => `How is the word used in the ${label}?`,
  ],
  purpose: [
    (stem, label) => `Why was the ${label} written?`,
    (stem, label) => `What is the writer’s purpose in the ${label}?`,
    (stem, label) => `What does the writer want to achieve with the ${label}?`,
  ],
  attitude: [
    (stem, label) => `Which words describe the writer’s tone in the ${label}?`,
    (stem, label) => `How would you characterise the tone of the ${label}?`,
    (stem, label) => `What attitude does the writer show in the ${label}?`,
  ],
}

export const READING_FOCUS = {
  'event-invitation': [
    f('gist', 'What is the message mainly about?', 'An invitation to a work or social gathering', ['A request for payment', 'A complaint about an event', 'A job application update'], 'The message invites the reader and asks for a reply.'),
    f('inference', 'What is expected of the recipient?', 'To confirm attendance in advance', ['To book a hotel room', 'To pay a deposit', 'To write a report'], 'Asking for a reply before a deadline means the recipient should confirm early.'),
    f('vocabulary', "What does 'reply' most nearly mean in the message?", 'Respond with an answer', ['Cancel the arrangement', 'Pay a fee', 'Prepare a presentation'], 'Here, reply means to respond to the invitation.'),
    f('purpose', 'Why was the message written?', 'To find out who can attend', ['To advertise a new product', 'To cancel a booking', 'To request a refund'], 'The writer invites people and asks them to respond.'),
    f('attitude', 'Which word best describes the tone?', 'Welcoming and practical', ['Angry and formal', 'Distant and cold', 'Humorous and casual'], 'The tone is friendly but also includes practical instructions.'),
  ],
  'travel-itinerary': [
    f('gist', 'What is the text mainly about?', 'A work trip plan with timings and arrangements', ['A hotel review', 'A flight advertisement', 'A meeting minutes document'], 'The text gives a destination, flight, hotel and first appointment.'),
    f('inference', 'What can be inferred about the first day?', 'The traveller has a full schedule', ['The traveller is free all afternoon', 'The flight is cancelled', 'The hotel is closed'], 'A morning flight followed by a business visit suggests a busy first day.'),
    f('vocabulary', "What does 'destination' mean in the itinerary?", 'The place someone is travelling to', ['The reason for a trip', 'The cost of a ticket', 'The name of a hotel'], 'A destination is the place a traveller is going to.'),
    f('purpose', 'Why was the itinerary written?', 'To guide the traveller through the trip', ['To advertise a travel agency', 'To complain about a flight', 'To invite colleagues to a meeting'], 'It lists what the traveller should do and where to go.'),
    f('inference', 'Which word best describes the style?', 'Clear and instructional', ['Emotional and personal', 'Critical and doubtful', 'Humorous and informal'], 'The text gives direct instructions and practical details.'),
  ],
  'meeting-agenda': [
    f('gist', 'What is the email mainly about?', 'A plan for an upcoming work discussion', ['A complaint about a colleague', 'A summary of last year’s results', 'An invitation to a party'], 'The email lists the meeting time, place and first topic.'),
    f('inference', 'What is expected of colleagues before the meeting?', 'To arrive prepared with relevant material', ['To cancel the meeting', 'To bring a guest', 'To present a new product'], 'The email asks people to prepare specific material in advance.'),
    f('vocabulary', "What does 'agenda' most nearly mean?", 'A list of items to discuss', ['A written apology', 'A meeting room', 'A company report'], 'An agenda is the planned list of topics for a meeting.'),
    f('purpose', 'Why did the writer send this email?', 'To prepare people for a meeting', ['To request a salary rise', 'To advertise an event', 'To close a project'], 'The writer gives details so colleagues know what to expect.'),
    f('attitude', 'Which word best describes the tone?', 'Organised and direct', ['Angry and urgent', 'Playful and vague', 'Cold and negative'], 'The email is structured and focused on arrangements.'),
  ],
  'training-announcement': [
    f('gist', 'What is the announcement mainly about?', 'A learning session and how to join it', ['A product price list', 'A staff complaint', 'A travel booking'], 'The text describes a course and registration details.'),
    f('inference', 'What is implied about places on the course?', 'They may be taken quickly', ['They are unlimited', 'They are only for managers', 'They have already been cancelled'], 'Limited places and a recommendation to register early imply demand is high.'),
    f('vocabulary', "What does 'register' mean here?", 'Sign up for the session', ['Read a report', 'Leave a company', 'Book a holiday'], 'To register is to officially sign up.'),
    f('purpose', 'What is the writer trying to do?', 'Encourage eligible staff to attend', ['Warn staff about a penalty', 'Sell a new product', 'Reschedule a meeting'], 'The announcement gives the audience and a registration method.'),
    f('attitude', 'Which word best describes the tone?', 'Informative and encouraging', ['Angry and dismissive', 'Uncertain and vague', 'Sad and apologetic'], 'The notice provides facts and encourages early action.'),
  ],
  'conference-schedule': [
    f('gist', 'What is the notice mainly about?', 'An outline of talks, workshops and arrangements', ['A review of a conference', 'A job vacancy', 'A product manual'], 'It gives the keynote, workshop, lunch and badge collection details.'),
    f('inference', 'What should attendees do before the opening talk?', 'Collect their identification badge', ['Buy a ticket', 'Choose a workshop', 'Leave the building'], 'The text says badges must be collected before the keynote begins.'),
    f('vocabulary', "What does 'keynote' mean?", 'The main talk of an event', ['A short break', 'A meeting room', 'A registration form'], 'A keynote is the central speech of a conference.'),
    f('purpose', 'Why was this schedule provided?', 'To help attendees plan their day', ['To advertise a hotel', 'To complain about organising', 'To announce a price increase'], 'The details let attendees know what happens and when.'),
    f('attitude', 'Which word best describes the tone?', 'Welcoming and organised', ['Critical and cold', 'Uncertain and rushed', 'Angry and formal'], 'The notice is practical and inviting.'),
  ],
  'project-status': [
    f('gist', 'What is the report mainly about?', 'An update on progress, risks and next actions', ['A final project apology', 'A job application', 'A customer complaint'], 'It states completion, a milestone, a risk and the next step.'),
    f('inference', 'What is the overall judgement of the project?', 'It is moving forward but still needs attention', ['It should be cancelled immediately', 'It has already failed', 'It is completely finished'], 'The report says it remains on track but needs close monitoring.'),
    f('vocabulary', "What does 'milestone' mean?", 'An important stage that has been reached', ['A final deadline', 'A financial penalty', 'A new team member'], 'A milestone is a significant point of progress.'),
    f('purpose', 'Why was the report written?', 'To keep stakeholders informed and alert', ['To request a refund', 'To advertise a service', 'To invite applications'], 'It updates readers and flags a risk that needs action.'),
    f('attitude', 'Which word best describes the tone?', 'Cautiously optimistic', ['Completely negative', 'Carefree and casual', 'Angry and urgent'], 'Progress is positive, but the risk requires caution.'),
  ],
  'complaint-response': [
    f('gist', 'What is the letter mainly about?', 'A company’s apology and proposed solution', ['A new product launch', 'A job interview invitation', 'A payment reminder'], 'The writer responds to a complaint and offers compensation.'),
    f('inference', 'What is the company trying to achieve?', 'To keep the customer’s trust', ['To end the relationship', 'To increase the price', 'To advertise another product'], 'Apologising and offering compensation are meant to restore confidence.'),
    f('vocabulary', "What does 'apology' mean?", 'An expression of regret', ['A request for payment', 'A written contract', 'A replacement part'], 'An apology says that the writer is sorry.'),
    f('purpose', 'Why did the company write the letter?', 'To resolve a problem and rebuild confidence', ['To announce a merger', 'To request a reference', 'To confirm a booking'], 'It offers a solution and thanks the customer for patience.'),
    f('attitude', 'Which word best describes the tone?', 'Apologetic but reassuring', ['Cold and dismissive', 'Angry and defensive', 'Playful and casual'], 'The writer is sorry but also offers practical help.'),
  ],
  'job-offer': [
    f('gist', 'What is the letter mainly about?', 'A formal proposal of employment with key terms', ['A staff training notice', 'A customer complaint', 'A conference invitation'], 'It gives the role, salary, start date and acceptance steps.'),
    f('inference', 'What must the candidate do next?', 'Take a formal step to accept', ['Wait to be contacted again', 'Start work immediately without notice', 'Advertise the role'], 'The letter says the candidate should confirm acceptance by a deadline.'),
    f('vocabulary', "What does 'probation' mean?", 'A trial period at the start of a job', ['A holiday allowance', 'A salary increase', 'A training course'], 'A probation period is an initial testing period.'),
    f('purpose', 'Why was the letter sent?', 'To set out terms and request acceptance', ['To reject an applicant', 'To announce a company merger', 'To invite someone to a meeting'], 'It offers the position and explains how to accept.'),
    f('attitude', 'Which word best describes the tone?', 'Formal and positive', ['Angry and critical', 'Casual and vague', 'Sad and apologetic'], 'The letter is professional and expresses welcome.'),
  ],
  'invoice-reminder': [
    f('gist', 'What is the message mainly about?', 'A notice that a payment is overdue', ['A request for a job reference', 'A meeting agenda', 'A product catalogue'], 'It says an invoice was due and has not been paid.'),
    f('inference', 'What does the sender want to avoid?', 'Further delay or extra charges', ['A price increase', 'A new contract', 'A staff meeting'], 'The message warns that a charge will be applied if payment is late.'),
    f('vocabulary', "What does 'outstanding' mean here?", 'Still unpaid', ['Excellent', 'Unexpected', 'Already returned'], 'An outstanding invoice is one that has not been paid.'),
    f('purpose', 'Why was the message written?', 'To prompt payment before penalties apply', ['To offer a discount', 'To confirm a delivery', 'To invite feedback'], 'It reminds the customer to pay and states the consequence of delay.'),
    f('attitude', 'Which word best describes the tone?', 'Polite but firm', ['Angry and rude', 'Casual and friendly', 'Uncertain and weak'], 'The writer is courteous but clear about the deadline.'),
  ],
  'office-relocation': [
    f('gist', 'What is the notice mainly about?', 'A workplace move and what staff must do', ['A new product launch', 'A staff party', 'A customer survey'], 'It gives the new address, reason, transport and packing instructions.'),
    f('inference', 'What are employees expected to do?', 'Pack personal items before the move', ['Book a hotel', 'Buy new furniture', 'Work from home permanently'], 'The notice asks staff to pack belongings by the Friday before the move.'),
    f('vocabulary', "What does 'relocation' mean?", 'Moving to a new place', ['A temporary closure', 'A pay rise', 'A training course'], 'Relocation is the act of moving to a new location.'),
    f('purpose', 'Why was the notice written?', 'To prepare staff for the move', ['To complain about the old office', 'To advertise a new service', 'To announce layoffs'], 'It explains the move and gives practical instructions.'),
    f('attitude', 'Which word best describes the tone?', 'Practical and reassuring', ['Angry and urgent', 'Distant and cold', 'Playful and vague'], 'The notice is matter-of-fact and offers a contact for questions.'),
  ],
  'recruitment-ad': [
    f('gist', 'What is the advert mainly about?', 'A job vacancy with requirements and benefits', ['A product review', 'A training schedule', 'A rental notice'], 'It lists the role, salary, requirements and application method.'),
    f('inference', 'What does the employer likely want?', 'Suitable applicants to apply promptly', ['More office furniture', 'A new supplier', 'A customer refund'], 'The advert gives a deadline and encourages applications from the right candidates.'),
    f('vocabulary', "What does 'successful candidate' mean?", 'The person who gets the job', ['The person who writes the advert', 'The current manager', 'A customer service agent'], 'The successful candidate is the one appointed to the role.'),
    f('purpose', 'Why was the advert written?', 'To attract suitable applicants', ['To announce a merger', 'To complain about staff', 'To sell office equipment'], 'It describes the role and how to apply.'),
    f('attitude', 'Which word best describes the tone?', 'Positive and encouraging', ['Negative and critical', 'Neutral and cold', 'Angry and firm'], 'The advert highlights benefits and welcomes applicants.'),
  ],
  'it-maintenance': [
    f('gist', 'What is the notice mainly about?', 'A warning that a system will be unavailable', ['A new software purchase', 'A team meeting', 'A customer feedback report'], 'It states which system is affected, when and what users should do.'),
    f('inference', 'What should users do beforehand?', 'Finish urgent work before the downtime', ['Ignore the notice', 'Buy a new computer', 'Contact a customer'], 'The notice asks users to save work and handle urgent requests early.'),
    f('vocabulary', "What does 'inconvenience' mean?", 'Trouble or disruption caused to people', ['A technical upgrade', 'A security warning', 'A financial reward'], 'Inconvenience is the difficulty caused by a disruption.'),
    f('purpose', 'Why was the notice written?', 'To tell users how to prepare for downtime', ['To advertise a new system', 'To request payment', 'To invite applications'], 'It explains the impact and gives preparation steps.'),
    f('attitude', 'Which word best describes the tone?', 'Apologetic but practical', ['Angry and blunt', 'Carefree and casual', 'Formal and cold'], 'The writer apologises but gives clear instructions.'),
  ],
  'product-launch-pr': [
    f('gist', 'What is the release mainly about?', 'An announcement of a new product and its intended users', ['A complaint about a product', 'A staff promotion', 'A market research method'], 'It names the product, target market, feature and price.'),
    f('inference', 'What can be inferred about development?', 'Customers were involved before the release', ['No testing took place', 'The product was an instant failure', 'The price is temporary'], 'Testing with more than 200 customers suggests customer input.'),
    f('vocabulary', "What does 'launch' mean?", 'The first public release of a product', ['A factory machine', 'A training course', 'A legal contract'], 'A launch is when a product is introduced to the market.'),
    f('purpose', 'Why was the release written?', 'To generate interest in a new product', ['To announce a price increase', 'To reject a proposal', 'To complain about delays'], 'It presents the product and its benefits to the public.'),
    f('attitude', 'Which word best describes the tone?', 'Promotional and confident', ['Critical and doubtful', 'Angry and defensive', 'Sad and quiet'], 'The quote and product details present a positive image.'),
  ],
  'policy-update': [
    f('gist', 'What is the notice mainly about?', 'A change to workplace rules', ['A new office address', 'A team-building event', 'A customer complaint'], 'It explains which policy changes, who is affected and what staff must do.'),
    f('inference', 'What is expected before the change takes effect?', 'Staff should complete the required action', ['Staff should ignore the update', 'Staff should resign', 'Staff should request a pay rise'], 'The notice says staff must act before the effective date.'),
    f('vocabulary', "What does 'comply' mean?", 'Follow the rules', ['Write a report', 'Change a job title', 'Cancel a meeting'], 'To comply is to act in accordance with a rule.'),
    f('purpose', 'Why was the notice written?', 'To explain a change and the required action', ['To advertise a new product', 'To invite applications', 'To announce a holiday'], 'It gives the change and tells staff what to do.'),
    f('attitude', 'Which word best describes the tone?', 'Formal and procedural', ['Playful and casual', 'Angry and urgent', 'Uncertain and vague'], 'The notice uses official language and clear steps.'),
  ],
  'supplier-proposal': [
    f('gist', 'What is the document mainly about?', 'A sales offer describing benefits and terms', ['A customer complaint', 'A job offer', 'A meeting agenda'], 'It gives the product, price, delivery, warranty and advantage.'),
    f('inference', 'What is the supplier hoping to do?', 'Win the buyer’s business', ['End a contract', 'Raise a complaint', 'Cancel a delivery'], 'A detailed proposal with advantages is meant to persuade the buyer.'),
    f('vocabulary', "What does 'advantage' mean?", 'A benefit compared with competitors', ['A legal warning', 'A delivery delay', 'A price increase'], 'An advantage is a positive feature that makes an offer stronger.'),
    f('purpose', 'Why was the proposal written?', 'To persuade the buyer to choose this supplier', ['To request a refund', 'To announce a policy', 'To invite job applications'], 'It presents an offer and asks for a meeting to discuss it.'),
    f('attitude', 'Which word best describes the tone?', 'Confident and persuasive', ['Angry and critical', 'Apologetic and weak', 'Cold and indifferent'], 'The supplier highlights strengths and experience.'),
  ],
  'performance-review': [
    f('gist', 'What is the document mainly about?', 'A summary of results and a development plan', ['A job advert', 'A customer survey', 'A project budget'], 'It covers strengths, an improvement area, a goal and a rating.'),
    f('inference', 'What is the overall view of the employee?', 'Valued but with clear areas to improve', ['Unsuitable for the role', 'Perfect in every way', 'About to be dismissed'], 'The review praises strengths and sets a development goal.'),
    f('vocabulary', "What does 'development' mean here?", 'Improvement or growth', ['A new office', 'A pay cut', 'A holiday plan'], 'In a review, development means building skills.'),
    f('purpose', 'Why was the review written?', 'To recognise strengths and agree on goals', ['To announce a product launch', 'To request payment', 'To cancel a contract'], 'It records progress and an agreed action plan.'),
    f('attitude', 'Which word best describes the tone?', 'Constructive and balanced', ['Harsh and negative', 'Carefree and casual', 'Angry and defensive'], 'The review is positive but also identifies areas for improvement.'),
  ],
  'market-research': [
    f('gist', 'What is the report mainly about?', 'Survey findings and a recommended action', ['A staff complaint', 'A product manual', 'A meeting schedule'], 'It gives the sample, key finding, competitor and recommendation.'),
    f('inference', 'What is the company likely to do next?', 'Respond to customer priorities', ['Ignore the results', 'Close the department', 'Raise prices immediately'], 'The recommendation is based on the most important customer priorities.'),
    f('vocabulary', "What does 'differentiate' mean?", 'Make an offer stand out from competitors', ['Copy a competitor', 'Lower quality', 'End a service'], 'To differentiate is to make something distinct.'),
    f('purpose', 'Why was the report written?', 'To support a decision with evidence', ['To entertain readers', 'To advertise a survey company', 'To complain about staff'], 'It uses research findings to justify a recommendation.'),
    f('attitude', 'Which word best describes the tone?', 'Analytical and decisive', ['Emotional and personal', 'Playful and vague', 'Angry and urgent'], 'The report interprets data and recommends action.'),
  ],
  'customer-survey': [
    f('gist', 'What is the report mainly about?', 'Feedback results and planned improvements', ['A product launch', 'A job interview', 'A legal contract'], 'It reports satisfaction, complaints, strengths and next steps.'),
    f('inference', 'What will the company probably focus on?', 'The issue reported most often', ['The cheapest service', 'A new office design', 'A price increase'], 'The planned action follows directly from the main complaint.'),
    f('vocabulary', "What does 'measure' mean here?", 'Assess progress', ['Hide a problem', 'Repeat a mistake', 'Ignore results'], 'To measure progress is to check how much improvement happens.'),
    f('purpose', 'Why was the report written?', 'To share feedback and outline next steps', ['To request payment', 'To announce a merger', 'To advertise a job'], 'It tells readers what customers said and what will change.'),
    f('attitude', 'Which word best describes the tone?', 'Open and improvement-focused', ['Defensive and cold', 'Angry and blunt', 'Carefree and casual'], 'The report admits problems and says how they will be addressed.'),
  ],
  'sustainability-report': [
    f('gist', 'What is the report mainly about?', 'Environmental progress and remaining challenges', ['A financial audit', 'A staff social event', 'A product catalogue'], 'It gives emissions data, targets, investment and a challenge.'),
    f('inference', 'What is implied about future work?', 'Progress alone will not meet the target', ['The target has already been met', 'No further action is needed', 'The company will stop reporting'], 'The director says the next phase requires closer collaboration.'),
    f('vocabulary', "What does 'acknowledges' mean?", 'Admits that something is true', ['Denies a problem', 'Celebrates a success', 'Ignores a detail'], 'To acknowledge a challenge is to admit it exists.'),
    f('purpose', 'Why was the report written?', 'To show progress while being honest about difficulties', ['To advertise a product', 'To request a refund', 'To invite applications'], 'It presents achievements and openly names the main obstacle.'),
    f('attitude', 'Which word best describes the tone?', 'Serious and cautious', ['Playful and casual', 'Angry and defensive', 'Carefree and excited'], 'The language is measured and focused on future effort.'),
  ],
  'contract-renewal': [
    f('gist', 'What is the letter mainly about?', 'An offer to extend an agreement with new terms', ['A complaint about a supplier', 'A job application', 'A product review'], 'It gives the expiry date, renewal term, new condition and deadline.'),
    f('inference', 'What happens if there is no reply?', 'The current arrangement will end', ['The contract renews automatically', 'The price will rise by 10%', 'A new supplier is chosen immediately'], 'The letter says that without confirmation the contract will end or be re-tendered.'),
    f('vocabulary', "What does 'expire' mean?", 'Come to an end', ['Begin again', 'Increase in value', 'Be signed early'], 'When a contract expires, it is no longer valid.'),
    f('purpose', 'Why was the letter written?', 'To secure a decision before the deadline', ['To announce a holiday', 'To request a meeting agenda', 'To complain about service'], 'It asks the partner to confirm acceptance by a date.'),
    f('attitude', 'Which word best describes the tone?', 'Professional and encouraging', ['Angry and threatening', 'Cold and dismissive', 'Playful and vague'], 'The writer values the relationship while setting a clear deadline.'),
  ],
}

export function focusFor(key, variantIndex) {
  return READING_FOCUS[key].map((item, focusIndex) => {
    const variants = STEM_VARIANTS[item.type] ?? [(stem) => stem]
    const selector = variantIndex % variants.length
    const label = CONTEXT_LABELS[key] ?? 'text'
    return { ...item, stem: variants[selector](item.stem, label) }
  })
}

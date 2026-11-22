const f = (type, stem, correct, distractors, explanation) => ({ type, stem, correct, distractors, explanation })

export const LISTENING_FOCUS = {
  'office-directions': [
    f('gist', 'What is the conversation mainly about?', 'A visitor asking where to go', ['A complaint about a meeting', 'A request for a price list', 'A job interview'], 'The visitor asks about a meeting location and route.'),
    f('inference', 'What can be inferred about the receptionist?', 'They expect the visitor to follow the directions', ['They are late for the meeting', 'They work in a different building', 'They do not know the office'], 'The receptionist gives clear instructions to the visitor.'),
    f('purpose', 'Why does the visitor say thank you?', 'To acknowledge the help received', ['To end a complaint', 'To confirm a payment', 'To request another question'], 'The visitor is thanking the receptionist for directions.'),
  ],
  'coffee-order': [
    f('gist', 'What is the main purpose of the conversation?', 'Placing an order at a café', ['Booking a hotel room', 'Asking for directions', 'Discussing a contract'], 'The customer orders a drink and the barista gives the price.'),
    f('inference', 'What can be inferred about the customer?', 'They have already decided what to buy', ['They are comparing two shops', 'They work at the café', 'They forgot their money'], 'The customer gives a specific order without asking for recommendations.'),
    f('purpose', 'Why does the barista mention the total?', 'To tell the customer what to pay', ['To advertise a promotion', 'To close the café early', 'To ask for a review'], 'The price is part of completing the order.'),
  ],
  'phone-message': [
    f('gist', 'What is the call mainly about?', 'Leaving a request for a callback', ['Confirming a hotel booking', 'Ordering office supplies', 'Reporting a theft'], 'The caller asks Daniel to call back about a specific matter.'),
    f('inference', 'What is likely to happen next?', 'Daniel will contact the caller', ['Daniel will ignore the message', 'The receptionist will place an order', 'The line will be disconnected'], 'A name, topic and callback time are all provided.'),
    f('purpose', 'Why does the caller give a number?', 'So the message can be returned', ['To confirm an address', 'To pay a bill', 'To identify a product'], 'The number lets Daniel call the person back.'),
  ],
  'meeting-change': [
    f('gist', 'What is the conversation about?', 'A change to a meeting arrangement', ['A cancelled flight', 'A new product design', 'A job application'], 'The speakers discuss a new time and place for a meeting.'),
    f('inference', 'What should listeners do with this information?', 'Update their meeting plans', ['Book a train ticket', 'Call a supplier', 'Cancel a holiday'], 'A rescheduled meeting requires people to adjust their plans.'),
    f('purpose', 'Why does Mark ask a question?', 'To understand the reason for the change', ['To request a pay rise', 'To complain about the room', 'To offer a new job'], 'Mark asks why the meeting was moved.'),
  ],
  'hotel-booking': [
    f('gist', 'What is happening at the reception?', 'A guest is being checked in', ['A room is being cleaned', 'A taxi is being booked', 'A conference is starting'], 'The receptionist confirms reservation details for the guest.'),
    f('inference', 'What can be inferred about the booking?', 'The reservation has already been made', ['The guest wants to cancel', 'The hotel is fully booked', 'The guest is arriving for the first time'], 'The receptionist refers to an existing reservation.'),
    f('purpose', 'Why does the guest thank the receptionist?', 'To acknowledge the confirmation', ['To end an argument', 'To request a discount', 'To ask for the bill'], 'The guest is responding politely to the check-in information.'),
  ],
  'train-delay': [
    f('gist', 'What is the announcement about?', 'A disruption to train services', ['A changed meeting agenda', 'A flight boarding call', 'A shop promotion'], 'The announcement gives a delay, reason and new platform.'),
    f('inference', 'What should passengers do?', 'Pay attention to the new platform', ['Leave the station immediately', 'Buy a new ticket', 'Call the railway station'], 'A different platform means passengers need to move.'),
    f('purpose', 'Why does the announcement apologize?', 'To acknowledge the inconvenience', ['To announce a prize', 'To welcome new staff', 'To confirm a booking'], 'An apology is a polite response to a delay.'),
  ],
  'office-supplies': [
    f('gist', 'What are the speakers discussing?', 'A request for workplace items', ['A staff party', 'A software update', 'A training course'], 'The conversation is about ordering supplies for the office.'),
    f('inference', 'What is likely to happen next?', 'The order will be processed', ['The office will close', 'The items will be returned', 'A meeting will be cancelled'], 'A supply request usually leads to processing the order.'),
    f('purpose', 'Why does the speaker mention a quantity?', 'To make the request specific', ['To compare two suppliers', 'To complain about a delivery', 'To request a refund'], 'Giving a quantity helps the other person fulfil the request.'),
  ],
  'lunch-reservation': [
    f('gist', 'What is the call mainly about?', 'Arranging a place to eat', ['Booking a hotel room', 'Reserving a meeting room', 'Ordering a taxi'], 'The caller asks for a table and gives a time.'),
    f('inference', 'What can be inferred about the restaurant?', 'It accepts advance bookings', ['It is closed that day', 'It has no tables available', 'It only serves breakfast'], 'A reservation can be made over the phone.'),
    f('purpose', 'Why does the caller give a name?', 'So the booking can be recorded', ['To pay a deposit', 'To request a menu', 'To complain about service'], 'A name is needed to identify the reservation.'),
  ],
  'project-update': [
    f('gist', 'What is the update about?', 'Progress and risks on a project', ['A new marketing campaign', 'A staff training plan', 'A customer survey'], 'The speakers discuss status, a risk and the next step.'),
    f('inference', 'What is the team’s current priority?', 'Managing a potential problem', ['Closing the project immediately', 'Hiring new staff', 'Changing the office location'], 'The main risk needs attention before the next stage.'),
    f('purpose', 'Why does the speaker mention a deadline?', 'To create urgency around the work', ['To announce a holiday', 'To describe a product feature', 'To request a refund'], 'A deadline helps listeners understand the time pressure.'),
  ],
  'job-interview': [
    f('gist', 'What is the conversation mainly about?', 'A candidate discussing their experience', ['A supplier negotiation', 'A customer complaint', 'A team meeting'], 'The interviewer asks about skills and previous work.'),
    f('inference', 'What can be inferred about the candidate?', 'They are being evaluated for a role', ['They already got the job', 'They work as the interviewer', 'They are negotiating a price'], 'An interview is used to assess whether someone is suitable.'),
    f('purpose', 'Why does the interviewer ask follow-up questions?', 'To learn more about the candidate', ['To end the interview early', 'To sell a product', 'To confirm a delivery'], 'Follow-up questions gather more detail.'),
  ],
  'customer-complaint': [
    f('gist', 'What is the call about?', 'A customer reporting a problem', ['A job application', 'A product launch', 'A meeting invitation'], 'The customer explains what went wrong and asks for help.'),
    f('inference', 'What does the customer want?', 'A practical solution to the issue', ['A new catalogue', 'A discount on future advertising', 'A change of address'], 'Complaints usually lead to a repair, refund or replacement.'),
    f('purpose', 'Why does the representative apologize?', 'To show the company takes the issue seriously', ['To advertise another product', 'To close the call immediately', 'To ask for a favour'], 'An apology is part of handling a complaint professionally.'),
  ],
  'invoice-payment': [
    f('gist', 'What is the conversation about?', 'Following up on an unpaid bill', ['Arranging a delivery', 'Booking a venue', 'Confirming a reservation'], 'The speakers discuss an invoice and when it will be paid.'),
    f('inference', 'What is the likely next step?', 'The customer will arrange payment', ['The invoice will be cancelled automatically', 'The supplier will visit the office', 'The amount will be doubled'], 'The discussion focuses on settling the outstanding amount.'),
    f('purpose', 'Why does the speaker mention a date?', 'To set a clear expectation', ['To announce a holiday', 'To describe a product launch', 'To confirm a job start'], 'Dates in payment discussions define deadlines.'),
  ],
  'conference-call': [
    f('gist', 'What is the call mainly about?', 'Joining a remote meeting', ['Ordering lunch', 'Planning a holiday', 'Renewing a contract'], 'The speakers discuss participants, timing and joining details.'),
    f('inference', 'What can be inferred about the meeting?', 'Not everyone is in the same room', ['Everyone is in one office', 'The call has been cancelled', 'The topic is a new product'], 'A conference call connects people remotely.'),
    f('purpose', 'Why does the speaker repeat the time?', 'To make sure everyone joins correctly', ['To request a refund', 'To close the discussion', 'To announce a result'], 'Repeating key details prevents confusion.'),
  ],
  'supplier-negotiation': [
    f('gist', 'What are the speakers doing?', 'Discussing terms with a supplier', ['Interviewing a candidate', 'Booking a hotel', 'Reporting a fault'], 'They talk about price, delivery and contract conditions.'),
    f('inference', 'What does each side want?', 'An agreement that works for both', ['To end the relationship', 'To avoid any discussion', 'To cancel an order'], 'Negotiation involves finding acceptable terms.'),
    f('purpose', 'Why does the supplier mention volume?', 'To support the proposed price', ['To request a holiday', 'To change the topic', 'To apologize for a delay'], 'Volume can justify pricing in a negotiation.'),
  ],
  'product-launch': [
    f('gist', 'What is the meeting about?', 'Preparing for a new product release', ['Closing a factory', 'Reviewing a complaint', 'Planning a staff party'], 'The team discusses timing, features and target customers.'),
    f('inference', 'What can be inferred about the launch?', 'It is still being planned', ['It has already failed', 'It is a secret from the team', 'It has no target audience'], 'The speakers are discussing future arrangements and features.'),
    f('purpose', 'Why does the speaker mention customers?', 'To explain who the product is for', ['To request a refund', 'To announce a price rise', 'To end the meeting'], 'Target customers shape launch decisions.'),
  ],
  'budget-review': [
    f('gist', 'What is the discussion about?', 'Reviewing spending and allocations', ['Choosing a new office colour', 'Planning a team lunch', 'Booking a conference room'], 'The speakers examine costs and where money should go.'),
    f('inference', 'What is likely to be decided next?', 'How to distribute the available funds', ['Whether to hire a manager', 'When to close the company', 'Which product to discontinue'], 'A budget review leads to allocation decisions.'),
    f('purpose', 'Why does the speaker mention last quarter?', 'To compare current and earlier figures', ['To announce a new product', 'To describe a location', 'To confirm a booking'], 'Past figures provide a benchmark for the review.'),
  ],
  'it-outage': [
    f('gist', 'What is the message about?', 'A temporary loss of IT service', ['A planned office move', 'A new recruitment campaign', 'A customer survey'], 'The speakers describe what is unavailable and for how long.'),
    f('inference', 'What should staff do?', 'Avoid relying on the affected system', ['Ignore the notice', 'Buy new hardware', 'Contact a customer'], 'An outage means the service cannot be used temporarily.'),
    f('purpose', 'Why is a contact given?', 'So staff can report urgent problems', ['To request payment', 'To confirm a delivery', 'To advertise a service'], 'A contact point is useful during a service disruption.'),
  ],
  'merger-discussion': [
    f('gist', 'What is the conversation about?', 'A possible combination of two companies', ['A product recall', 'A training session', 'A customer complaint'], 'The speakers discuss benefits and concerns of a merger.'),
    f('inference', 'What is a major concern?', 'How the two organisations will work together', ['What colour the logo should be', 'Where to buy office chairs', 'How to order lunch'], 'Integration is a common issue in mergers.'),
    f('purpose', 'Why does the speaker mention risks?', 'To encourage careful evaluation', ['To end the discussion immediately', 'To advertise a product', 'To confirm a booking'], 'Risks are raised so they can be considered before a decision.'),
  ],
  'compliance-audit': [
    f('gist', 'What is the meeting about?', 'Checking whether rules are being followed', ['Planning a product launch', 'Organising a party', 'Booking a flight'], 'The speakers discuss documents, procedures and findings.'),
    f('inference', 'What is the aim of the audit?', 'To identify gaps and fix them', ['To advertise the company', 'To hire new staff', 'To cancel a contract'], 'Audits are used to check compliance and improve processes.'),
    f('purpose', 'Why does the speaker ask for records?', 'To verify the information', ['To request a refund', 'To close the meeting', 'To announce a price'], 'Records are needed as evidence in an audit.'),
  ],
  'strategic-planning': [
    f('gist', 'What is the discussion mainly about?', 'Setting long-term priorities and risks', ['Choosing office furniture', 'Planning a daily schedule', 'Ordering supplies'], 'The speakers consider investment, returns and possible risks.'),
    f('inference', 'What can be inferred about the plan?', 'It involves both opportunity and uncertainty', ['It has already been approved', 'It has no risks', 'It focuses only on the past'], 'Expected returns and main risks are both discussed.'),
    f('purpose', 'Why does the speaker mention a timeline?', 'To show when the plan should happen', ['To request a day off', 'To describe a product colour', 'To end a conversation'], 'A timeline gives the plan a practical schedule.'),
  ],
}

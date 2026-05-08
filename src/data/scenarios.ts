// Hand-tuned synthetic scenarios. No real customer data.
// Each scenario maps short evidence quotes to specific rubric criterion IDs.

export interface CallScenario {
  id: string;
  topic: string;
  category: string; // ServiceNow category
  queue: string; // Genesys queue
  customerName: string;
  summary: string;
  turns: { speaker: 'agent' | 'customer'; text: string; ms: number; criterionId?: string }[];
}

export interface TextScenario {
  id: string;
  topic: string;
  category: string;
  channel: 'email' | 'portal' | 'chat';
  customerName: string;
  summary: string;
  // for chat: turns; for email/portal: paragraphs
  turns?: { speaker: 'agent' | 'customer'; text: string; ms: number; criterionId?: string }[];
  body?: { paragraph: string; criterionId?: string }[];
  subject?: string;
}

export interface CSATScenario {
  id: string;
  score: 1 | 2 | 3 | 4 | 5;
  verbatim: string;
  themes: string[];
}

// ----- CALL SCENARIOS (rich) -----
export const CALL_SCENARIOS: CallScenario[] = [
  {
    id: 'call-benefits-1',
    topic: 'Benefits enrollment — adding a dependent',
    category: 'Benefits / Enrollment',
    queue: 'HR4U-Benefits',
    customerName: 'Jordan',
    summary:
      'Caller wanted to add a newborn dependent to medical and dental coverage. Agent walked through documentation required and submitted the qualifying life event.',
    turns: [
      { speaker: 'agent', text: 'Thank you for calling HR4U, this is the Benefits team. May I have your associate ID, please?', ms: 0, criterionId: 'requirements.greeting' },
      { speaker: 'customer', text: "Hi, it's 4421-9907. We just had a baby and I need to add him to our medical and dental.", ms: 5200 },
      { speaker: 'agent', text: 'Congratulations! That is wonderful news. I can help you get your son added today — first, can I confirm your name and the last four of your SSN to verify the account?', ms: 9100, criterionId: 'courteous.empathy' },
      { speaker: 'customer', text: "Sure — Jordan Whitaker, last four is 7732.", ms: 14500 },
      { speaker: 'agent', text: 'Thank you, Jordan, you are verified. A new child is a qualifying life event, so we have 60 days from the date of birth to enroll. What was his date of birth?', ms: 18000, criterionId: 'accurate.info' },
      { speaker: 'customer', text: 'October 14th.', ms: 22000 },
      { speaker: 'agent', text: "Perfect, that puts you well inside the 60-day window. I'll open the qualifying life event in the portal, and what we'll need from you is a copy of the birth certificate or hospital discharge paperwork once it's available — you'll have 30 days to upload it after I open the event.", ms: 24800, criterionId: 'accurate.complete' },
      { speaker: 'customer', text: "Got it. And his coverage starts the day he was born?", ms: 32000 },
      { speaker: 'agent', text: "Yes — coverage is retroactive to date of birth. I'm also documenting the case in our system right now so you have a reference number, and I'll send a confirmation email summarizing the next steps.", ms: 35200, criterionId: 'accurate.documentation' },
      { speaker: 'customer', text: 'That would be great, thank you.', ms: 42000 },
      { speaker: 'agent', text: "Of course — and just so you know, you'll see the change reflect in HR4U within two business days. Is there anything else I can help you with today, Jordan?", ms: 44100, criterionId: 'control.personalized' },
      { speaker: 'customer', text: "No, that's it.", ms: 50000 },
      { speaker: 'agent', text: "Wonderful. Once again, congratulations on your new arrival, and have a great rest of your day.", ms: 52000, criterionId: 'requirements.closing' },
    ],
  },
  {
    id: 'call-leave-1',
    topic: 'FMLA — intermittent leave certification',
    category: 'Leave / FMLA',
    queue: 'HR4U-Leave',
    customerName: 'Priya',
    summary:
      'Caller asked about extending an intermittent FMLA leave for ongoing migraine treatment. Agent explained certification requirements and recertification timeline.',
    turns: [
      { speaker: 'agent', text: 'HR4U Leave team, this is Maya. May I have your associate ID?', ms: 0, criterionId: 'requirements.greeting' },
      { speaker: 'customer', text: '8821-1147 — I had intermittent leave approved for migraines and it expires next month, what do I do to extend?', ms: 4500 },
      { speaker: 'agent', text: "I'm sorry you're still dealing with that — let me pull up your case so we can keep your coverage continuous.", ms: 11000, criterionId: 'courteous.empathy' },
      { speaker: 'customer', text: 'Thanks.', ms: 16000 },
      { speaker: 'agent', text: "Okay, I see your current certification expires November 18. To extend, your provider needs to complete a recertification form — I can send you the WH-380-E. You'll have 15 calendar days to return it after I send.", ms: 17500, criterionId: 'accurate.info' },
      { speaker: 'customer', text: 'Will my leave keep working while I get that signed?', ms: 27000 },
      { speaker: 'agent', text: "Yes — as long as you submit it within the 15-day window your leave will not lapse. I'll note the case so the team is aware. Would you like me to send the form to your work email or personal?", ms: 29200, criterionId: 'control.personalized' },
      { speaker: 'customer', text: 'Personal please.', ms: 38500 },
      { speaker: 'agent', text: "Done. You'll receive it within the next 15 minutes. Is there anything else I can help you with today, Priya?", ms: 40200, criterionId: 'accurate.documentation' },
      { speaker: 'customer', text: "No, that's everything, thank you.", ms: 46000 },
      { speaker: 'agent', text: "You're very welcome. Take care.", ms: 48000, criterionId: 'requirements.closing' },
    ],
  },
  {
    id: 'call-payroll-1',
    topic: 'Missing overtime on most recent paycheck',
    category: 'Payroll / Pay Discrepancy',
    queue: 'HR4U-Payroll',
    customerName: 'Marco',
    summary:
      'Caller saw missing overtime hours on his Oct 25 paycheck. Agent collected the missed shifts, opened a pay correction case, and set expectation on retro pay.',
    turns: [
      { speaker: 'agent', text: 'HR4U Payroll, you are speaking with Devon. Can I have your associate ID?', ms: 0, criterionId: 'requirements.greeting' },
      { speaker: 'customer', text: 'Yeah, 6712-3309. My check from last Friday is short — I had eight hours of overtime that did not show up.', ms: 4800 },
      { speaker: 'agent', text: "I understand how frustrating that is, especially mid-month. Let's get this corrected. Can you tell me the dates and approximate hours worked?", ms: 12000, criterionId: 'courteous.empathy' },
      { speaker: 'customer', text: 'Saturday October 11 I worked four hours after shift, and Sunday October 12 I came in for another four hours.', ms: 19000 },
      { speaker: 'agent', text: "Thank you. I'm pulling up your timecards now — I do see those punches were entered as regular hours rather than OT. I'll open a pay correction case to have that reclassified and processed as off-cycle pay.", ms: 26500, criterionId: 'accurate.info' },
      { speaker: 'customer', text: 'How long does that take?', ms: 35000 },
      { speaker: 'agent', text: 'Off-cycle adjustments typically deposit within three business days. I will send you the case number once the request is logged so you can follow up directly if needed.', ms: 36800, criterionId: 'accurate.complete' },
      { speaker: 'customer', text: 'Okay, that works.', ms: 44000 },
      { speaker: 'agent', text: "Great. I'm documenting this now under case PAY-72119 — you'll see it under your tickets in HR4U. Is there anything else I can help with, Marco?", ms: 45200, criterionId: 'accurate.documentation' },
      { speaker: 'customer', text: 'No, thanks for the help.', ms: 52000 },
      { speaker: 'agent', text: "Of course. Have a great rest of your day.", ms: 53500, criterionId: 'requirements.closing' },
    ],
  },
  {
    id: 'call-onboarding-1',
    topic: 'I-9 reverification reminder',
    category: 'Lifecycle / I-9',
    queue: 'HR4U-Lifecycle',
    customerName: 'Aisha',
    summary:
      'Caller received an I-9 reverification reminder and was unsure which documents she needed to present. Agent walked through the List A vs B+C options.',
    turns: [
      { speaker: 'agent', text: 'HR4U Lifecycle, this is Sasha. How can I help?', ms: 0, criterionId: 'requirements.greeting' },
      { speaker: 'customer', text: 'I got an email saying I need to do an I-9 reverification by November 1 and I do not know what to bring.', ms: 4500 },
      { speaker: 'agent', text: "Of course — I can walk you through the options. Can I first confirm your associate ID?", ms: 11000, criterionId: 'requirements.greeting' },
      { speaker: 'customer', text: '5532-2210, Aisha Patel.', ms: 15000 },
      { speaker: 'agent', text: "Thank you, Aisha — verified. You'll need either one document from List A, like a U.S. passport or permanent resident card, or one document from List B together with one from List C. The most common combination is a driver's license plus an unrestricted Social Security card.", ms: 17500, criterionId: 'accurate.info' },
      { speaker: 'customer', text: 'Got it. Where do I bring them?', ms: 27500 },
      { speaker: 'agent', text: "We use a remote verification through HireRight — you'll get an email within an hour of this call with a link to upload the documents. The whole process should take about ten minutes.", ms: 29800, criterionId: 'accurate.complete' },
      { speaker: 'customer', text: 'Perfect.', ms: 38000 },
      { speaker: 'agent', text: "I'm documenting your call so the team has a record, and a reminder will go out two days before the deadline if HireRight has not yet received the upload. Is there anything else I can help you with, Aisha?", ms: 39200, criterionId: 'control.personalized' },
      { speaker: 'customer', text: "No, that covers it, thanks.", ms: 47000 },
      { speaker: 'agent', text: "You're welcome — have a great day.", ms: 48800, criterionId: 'requirements.closing' },
    ],
  },
  {
    id: 'call-poor-1',
    topic: '401(k) deferral change request',
    category: '401(k) / Deferral',
    queue: 'HR4U-Benefits',
    customerName: 'Brian',
    summary:
      "Caller asked to change his 401(k) deferral percentage. Agent moved through the call quickly and missed an empathy moment when the caller mentioned a recent layoff scare.",
    turns: [
      { speaker: 'agent', text: 'Benefits team. ID please?', ms: 0, criterionId: 'requirements.greeting' },
      { speaker: 'customer', text: 'It is 3398-5512 — I want to change my 401(k) deferral, and I am honestly a little nervous because of the layoff news this morning.', ms: 4500 },
      { speaker: 'agent', text: 'Okay. So you want to change your deferral percentage. What percentage?', ms: 14000 },
      { speaker: 'customer', text: 'Drop it from 12 to 6.', ms: 19000 },
      { speaker: 'agent', text: "Got it. I'll make that change effective the next pay period.", ms: 21000 },
      { speaker: 'customer', text: 'Will the company match still apply?', ms: 27000 },
      { speaker: 'agent', text: "Yes you'll still get the match up to 6%.", ms: 29000, criterionId: 'accurate.info' },
      { speaker: 'customer', text: 'Okay good.', ms: 33000 },
      { speaker: 'agent', text: 'Anything else?', ms: 34000 },
      { speaker: 'customer', text: 'No.', ms: 36000 },
      { speaker: 'agent', text: 'Bye.', ms: 37000, criterionId: 'requirements.closing' },
    ],
  },
];

// ----- EMAIL SCENARIOS (rich) -----
export const EMAIL_SCENARIOS: TextScenario[] = [
  {
    id: 'email-benefits-1',
    topic: 'HSA contribution rollover question',
    category: 'Benefits / HSA',
    channel: 'email',
    customerName: 'Eleanor',
    subject: 'Re: HSA contribution rollover',
    summary:
      'Composer asked whether unused HSA dollars roll over year to year. Agent confirmed and added the 2026 contribution limits.',
    body: [
      { paragraph: "Hi Eleanor,", criterionId: 'personalized.address' },
      { paragraph: "Thank you for reaching out — happy to help clarify how HSA dollars carry over.", criterionId: 'courteous.tone' },
      {
        paragraph:
          "Yes — any unused balance in your Health Savings Account rolls over from year to year and remains yours for life, even if you change employers or health plans. There is no \"use it or lose it\" rule for HSAs (unlike a Healthcare FSA).",
        criterionId: 'accurate.info',
      },
      {
        paragraph:
          "For 2026, the IRS contribution limits are $4,400 for self-only coverage and $8,750 for family coverage, with an additional $1,000 catch-up if you are 55 or older. You can adjust your contribution any time through HR4U > Benefits > Manage HSA.",
        criterionId: 'accurate.complete',
      },
      { paragraph: "I have logged this exchange under HRC8821140 for your records.", criterionId: 'requirements.format' },
      { paragraph: "Please reply to this thread if anything else comes up — happy to help.", criterionId: 'personalized.guidance' },
      { paragraph: "Warm regards,\nMaya Chen\nHR4U Benefits Team", criterionId: 'requirements.format' },
    ],
  },
  {
    id: 'email-leave-1',
    topic: 'Bereavement leave eligibility',
    category: 'Leave / Bereavement',
    channel: 'email',
    customerName: 'Rashid',
    subject: 'Re: Time off after my grandmother\'s passing',
    summary:
      'Composer asked about bereavement leave following the passing of his grandmother. Agent expressed condolences, confirmed eligibility, and outlined steps.',
    body: [
      { paragraph: "Dear Rashid,", criterionId: 'personalized.address' },
      {
        paragraph:
          "Please accept my sincere condolences on the loss of your grandmother. Take the time you need, and I am here to walk you through the process.",
        criterionId: 'courteous.empathy',
      },
      {
        paragraph:
          "Bereavement leave at HR4U covers immediate and extended family, including grandparents. You are eligible for up to five (5) calendar days of paid bereavement leave for the loss of a grandparent.",
        criterionId: 'accurate.info',
      },
      {
        paragraph:
          "To request the time, log into HR4U > Time Off > Request Leave and select \"Bereavement.\" You may be asked to upload a copy of the death notice or service program — but that is reviewed sensitively and only if your manager requires verification. If that step adds difficulty, please reply to me directly and I will handle it through the case.",
        criterionId: 'accurate.complete',
      },
      { paragraph: "I have logged this conversation under HRC8714020 for your records.", criterionId: 'requirements.format' },
      {
        paragraph:
          "If you would like, I can also coordinate temporary coverage with your manager — just let me know.",
        criterionId: 'personalized.guidance',
      },
      { paragraph: "With sympathy,\nDevon Rivera\nHR4U Leave Team", criterionId: 'requirements.format' },
    ],
  },
  {
    id: 'email-payroll-1',
    topic: 'Final paycheck for separating employee',
    category: 'Payroll / Separation',
    channel: 'email',
    customerName: 'Tasha',
    subject: 'Re: My last day pay',
    summary:
      "Composer asked when she would receive her final paycheck after separation. Agent confirmed timing and PTO payout.",
    body: [
      { paragraph: "Hi Tasha,", criterionId: 'personalized.address' },
      { paragraph: "Thank you for reaching out, and best wishes on your next chapter.", criterionId: 'courteous.tone' },
      {
        paragraph:
          "Your final paycheck — including all hours worked through your last day — will be issued through our standard direct deposit on the next regular pay date, which for your group is November 7. Your earned-but-unused PTO will be paid out on the same deposit at your regular hourly rate.",
        criterionId: 'accurate.info',
      },
      {
        paragraph:
          "If you would like a paper check mailed instead, let me know by November 4 and I can request that change. Tax forms (W-2) for 2026 will be issued in late January and you can access them via the alumni portal — instructions to come in your offboarding email.",
        criterionId: 'accurate.complete',
      },
      { paragraph: "Logged under HRC8799010 for your records.", criterionId: 'requirements.format' },
      { paragraph: "Reach out any time if questions come up.", criterionId: 'personalized.guidance' },
      { paragraph: "Best,\nJacob Patel\nHR4U Payroll Team", criterionId: 'requirements.format' },
    ],
  },
  {
    id: 'email-poor-1',
    topic: 'Tuition reimbursement deadlines',
    category: 'Benefits / Tuition',
    channel: 'email',
    customerName: 'Nina',
    subject: 'Re: tuition reimburs',
    summary:
      'Composer asked about tuition reimbursement deadlines. Agent gave a brief, somewhat curt response without confirming the policy.',
    body: [
      { paragraph: "Hi,", criterionId: 'personalized.address' },
      { paragraph: "you have 60 days from completion to submit.", criterionId: 'accurate.info' },
      { paragraph: "Thanks", criterionId: 'requirements.format' },
    ],
  },
];

// ----- CHAT SCENARIOS (rich) -----
export const CHAT_SCENARIOS: TextScenario[] = [
  {
    id: 'chat-payroll-1',
    topic: 'Direct deposit account update',
    category: 'Payroll / Direct Deposit',
    channel: 'chat',
    customerName: 'Theo',
    summary: 'Composer asked how to update his direct deposit. Agent walked through the steps and confirmed timing.',
    turns: [
      { speaker: 'customer', text: 'hey, how do I change my direct deposit account? new bank.', ms: 0 },
      { speaker: 'agent', text: 'Hi Theo — happy to help! Can you confirm your associate ID first so I can pull up your account?', ms: 4000, criterionId: 'requirements.auth' },
      { speaker: 'customer', text: '6612-2241', ms: 9000 },
      { speaker: 'agent', text: 'Thanks, you are verified. To update your direct deposit, head to HR4U > Pay > Direct Deposit and click "Add new account." You will need your routing and account numbers handy.', ms: 12000, criterionId: 'accurate.info' },
      { speaker: 'customer', text: 'how long until it takes effect?', ms: 24000 },
      { speaker: 'agent', text: 'If you save the change before tomorrow at 5pm ET, it applies to the next pay run. Otherwise it would land on the following pay cycle. I would also recommend leaving the old account open for one full pay period as a safety net.', ms: 27000, criterionId: 'accurate.complete' },
      { speaker: 'customer', text: 'awesome, thank you', ms: 38000 },
      { speaker: 'agent', text: 'Of course! This chat is on the live-agent leg now (IMS2883201) and I have logged the underlying case as HRC8832010 for your records. Anything else?', ms: 40500, criterionId: 'requirements.format' },
      { speaker: 'customer', text: 'no thats it', ms: 47000 },
      { speaker: 'agent', text: 'Have a great day, Theo.', ms: 48000 },
    ],
  },
  {
    id: 'chat-benefits-1',
    topic: 'Open enrollment plan comparison',
    category: 'Benefits / Open Enrollment',
    channel: 'chat',
    customerName: 'Wendy',
    summary: 'Composer was deciding between PPO and HDHP plans during open enrollment. Agent compared key tradeoffs and pointed to the decision tool.',
    turns: [
      { speaker: 'customer', text: "Hi! I'm trying to decide between the PPO and the HDHP this year. Any guidance?", ms: 0 },
      { speaker: 'agent', text: 'Hi Wendy! Great timing — open enrollment closes November 21. I can give you a quick comparison and then point you to a personalized cost tool.', ms: 4000, criterionId: 'courteous.tone' },
      { speaker: 'customer', text: 'sounds good', ms: 11000 },
      { speaker: 'agent', text: 'The PPO has a $500 deductible and copays for most visits, with a higher monthly premium. The HDHP has a $2,000 deductible but is paired with an HSA — including $750 employer seed dollars — and a much lower monthly premium. The HDHP often wins for healthier years; the PPO can be better in years with planned procedures.', ms: 14000, criterionId: 'accurate.info' },
      { speaker: 'customer', text: 'any tool to play with the numbers?', ms: 26000 },
      { speaker: 'agent', text: 'Yes — HR4U > Benefits > Open Enrollment > Plan Comparison Tool. It uses your prior-year claims to estimate total cost under each option.', ms: 28500, criterionId: 'personalized.guidance' },
      { speaker: 'customer', text: 'perfect, thank you!', ms: 38000 },
      { speaker: 'agent', text: 'Of course. Linked to HRC8800090 — reach out again any time.', ms: 39800, criterionId: 'requirements.format' },
    ],
  },
];

// ----- PORTAL SCENARIOS (rich) -----
export const PORTAL_SCENARIOS: TextScenario[] = [
  {
    id: 'portal-leave-1',
    topic: 'Short-term disability claim status',
    category: 'Leave / STD',
    channel: 'portal',
    customerName: 'Renata',
    subject: 'Re: STD claim status',
    summary:
      'Composer submitted a portal case asking about her STD claim status. Agent provided a status update with next-step expectations.',
    body: [
      { paragraph: 'Hi Renata,', criterionId: 'personalized.address' },
      { paragraph: 'Thanks for following up — I know waiting on a claim is stressful.', criterionId: 'courteous.empathy' },
      {
        paragraph:
          'Your short-term disability claim (SDB-44218) is currently in medical review with our carrier. The latest note from October 28 indicates they are awaiting your provider\'s attending-physician statement (APS).',
        criterionId: 'accurate.info',
      },
      {
        paragraph:
          'Once the APS is received, the carrier typically issues a determination within 5 business days. I would recommend reaching out to your provider\'s office to confirm the form has been submitted — many providers use a fax line that can be slow.',
        criterionId: 'accurate.complete',
      },
      { paragraph: "I'll keep this case open until you have a determination, and I'll proactively check back next Tuesday.", criterionId: 'personalized.guidance' },
      { paragraph: 'Logged under HRC8855010.', criterionId: 'requirements.format' },
      { paragraph: 'Take care,\nMira Joshi\nHR4U Leave Team', criterionId: 'requirements.format' },
    ],
  },
  {
    id: 'portal-payroll-1',
    topic: 'W-4 update',
    category: 'Payroll / Tax',
    channel: 'portal',
    customerName: 'Carlos',
    subject: 'Re: How do I update my W-4?',
    summary:
      'Composer submitted a portal case asking how to update his federal W-4 withholding. Agent provided a step-by-step path and timing.',
    body: [
      { paragraph: 'Hi Carlos,', criterionId: 'personalized.address' },
      { paragraph: 'Happy to walk you through this!', criterionId: 'courteous.tone' },
      {
        paragraph:
          'You can update your federal W-4 directly in HR4U: go to Pay > Tax Withholdings > Federal. Save your changes and the new withholding takes effect on the next pay run if submitted before Wednesday at 5pm ET.',
        criterionId: 'accurate.info',
      },
      {
        paragraph:
          'A common ask: if you want a flat additional dollar amount withheld each pay, you can enter it on Step 4(c) of the form. State withholdings are managed on the same screen — make sure to submit your state form too if you are changing both.',
        criterionId: 'accurate.complete',
      },
      { paragraph: 'Reach back out if anything looks off after the next pay statement.', criterionId: 'personalized.guidance' },
      { paragraph: 'Logged under HRC8871180.', criterionId: 'requirements.format' },
      { paragraph: 'Best,\nTyler Nguyen\nHR4U Payroll Team', criterionId: 'requirements.format' },
    ],
  },
];

// ----- CSAT scenarios -----
export const CSAT_SCENARIOS: CSATScenario[] = [
  { id: 'csat-1', score: 5, verbatim: 'Maya was incredibly patient and walked me through every step. Felt like she actually cared.', themes: ['empathy', 'patience'] },
  { id: 'csat-2', score: 5, verbatim: 'Issue resolved on the first call — exactly what I needed. Thank you!', themes: ['first-call resolution', 'efficiency'] },
  { id: 'csat-3', score: 4, verbatim: 'Helpful but felt a little rushed at the end. Got me what I needed though.', themes: ['rushed', 'helpful'] },
  { id: 'csat-4', score: 4, verbatim: 'Good service. Wait time was a bit longer than I hoped.', themes: ['wait time'] },
  { id: 'csat-5', score: 3, verbatim: 'Got an answer but had to repeat myself a few times.', themes: ['knowledge gap', 'repetition'] },
  { id: 'csat-6', score: 2, verbatim: 'Information turned out to be incorrect — got transferred twice. Frustrating.', themes: ['accuracy', 'transfer experience'] },
  { id: 'csat-7', score: 1, verbatim: 'Agent seemed annoyed I called. Did not feel heard at all.', themes: ['empathy', 'tone'] },
  { id: 'csat-8', score: 5, verbatim: 'Above and beyond. Followed up two days later just to make sure things worked. Loved it.', themes: ['follow-up', 'proactive'] },
  { id: 'csat-9', score: 4, verbatim: 'Knowledgeable agent. Resolution took two interactions but was correct.', themes: ['knowledge', 'follow-up'] },
  { id: 'csat-10', score: 2, verbatim: 'Was disconnected mid-call and nobody called back.', themes: ['system error', 'follow-up'] },
];

// Pool of short summaries used for non-rich evaluations
export const SHORT_SUMMARIES: Record<string, string[]> = {
  call: [
    'Caller requested a benefits summary for the upcoming open enrollment cycle.',
    'Agent helped associate enroll in the EAP after a stressful event.',
    'Caller verified PTO accrual rate after a recent role change.',
    'Caller asked about FSA carry-over rules; agent provided amounts and deadlines.',
    'Caller requested an off-cycle paycheck after a missed shift correction.',
    'Caller reported issue with timecard punch missing on Tuesday.',
    'Caller asked about the new wellness reimbursement program.',
    'Caller needed help retrieving an electronic W-2.',
    'Caller wanted to add a spouse to dental coverage during a qualifying event.',
    'Caller checked status of an employment verification letter.',
    'Caller asked which holidays were paid this year.',
    'Caller asked about jury duty pay policy.',
    'Caller asked about the company match true-up for the prior year.',
    'Caller inquired about transfer process between business units.',
    'Caller asked how to enroll in the commuter benefits program.',
    'Caller asked about military leave coverage.',
    'Caller asked about ACA 1095-C reissue timing.',
    'Caller wanted help correcting a name change after marriage.',
    'Caller asked how to access the alumni portal after retirement.',
    'Caller asked about adoption assistance reimbursement.',
  ],
  email: [
    'Composer asked about their next vesting milestone for RSUs.',
    'Composer inquired about the wellness program reimbursement.',
    'Composer asked for confirmation that their address change was reflected on payroll.',
    'Composer requested verification of employment for a mortgage application.',
    'Composer asked about transferring an HSA balance from a prior employer.',
    'Composer asked about beneficiary updates after a marriage.',
    'Composer asked when the next open enrollment window started.',
    'Composer asked how to reset their HR4U password.',
    'Composer requested a copy of their I-9 record.',
    'Composer asked about jury duty pay continuation.',
    'Composer asked about the company tuition reimbursement program.',
    'Composer asked about commuter benefit deduction timing.',
  ],
  chat: [
    'Composer asked where to find their pay stubs.',
    'Composer asked how PTO requests interact with holidays.',
    'Composer asked how to change their tax withholding.',
    'Composer asked which paid holidays were observed this year.',
    'Composer asked when the next paycheck would deposit.',
    'Composer asked about the bereavement policy.',
  ],
  portal: [
    'Composer submitted a case requesting a temporary remote work arrangement.',
    'Composer submitted a question about wellness program reimbursement.',
    'Composer submitted a case for a stipend reimbursement.',
    'Composer submitted a request to update emergency contact.',
    'Composer asked for clarification on the parental leave policy.',
  ],
};

export const CATEGORIES_BY_CHANNEL: Record<string, string[]> = {
  call: ['Benefits / Enrollment', 'Leave / FMLA', 'Payroll / Pay Discrepancy', '401(k) / Deferral', 'Lifecycle / I-9', 'Time Off'],
  email: ['Benefits / HSA', 'Leave / Bereavement', 'Payroll / Separation', 'Benefits / Tuition', 'Tax / W-4', 'Lifecycle / Verification'],
  chat: ['Payroll / Direct Deposit', 'Benefits / Open Enrollment', 'Time Off', 'Tax / W-4'],
  portal: ['Leave / STD', 'Payroll / Tax', 'Lifecycle / Remote Work', 'Wellness'],
  csat: ['Survey'],
};

export const QUEUES = ['HR4U-Benefits', 'HR4U-Leave', 'HR4U-Payroll', 'HR4U-Lifecycle', 'HR4U-Wellness'];
